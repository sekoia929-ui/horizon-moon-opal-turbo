"""Optional Streamlit desk for the Docker data plane.

The primary interactive product is the SENTRA web terminal. This app is a
lightweight operator view over the same Postgres/Redis stores.
"""

from __future__ import annotations

import os

import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from sqlalchemy import create_engine, text

st.set_page_config(page_title="SENTRA", layout="wide")
st.title("SENTRA")
st.caption("Operator view — sentiment vs price. Prefer the web terminal for the live desk.")

dsn = os.getenv(
    "DATABASE_URL",
    "postgresql://sentra:sentra@postgres:5432/sentra",
)
engine = create_engine(dsn)

asset = st.sidebar.selectbox("Asset", ["btc", "eth", "sol", "doge", "xrp", "link"])

try:
    with engine.connect() as conn:
        prices = pd.read_sql(
            text(
                "select ts, price from market_snapshots where asset = :a order by ts desc limit 288"
            ),
            conn,
            params={"a": asset},
        )
        sent = pd.read_sql(
            text(
                "select ts, score from sentiment_snapshots where asset = :a order by ts desc limit 288"
            ),
            conn,
            params={"a": asset},
        )
except Exception as exc:
    st.error(f"Database unavailable: {exc}")
    st.stop()

if prices.empty:
    st.info("No snapshots yet. Start the worker to fill the tape.")
    st.stop()

prices = prices.sort_values("ts")
sent = sent.sort_values("ts")
fig = go.Figure()
fig.add_trace(go.Scatter(x=prices["ts"], y=prices["price"], name="Price", yaxis="y"))
if not sent.empty:
    fig.add_trace(go.Scatter(x=sent["ts"], y=sent["score"], name="Sentiment", yaxis="y2"))
fig.update_layout(
    template="plotly_dark",
    yaxis=dict(title="Price"),
    yaxis2=dict(title="Sentiment", overlaying="y", side="right", range=[-1, 1]),
    margin=dict(l=40, r=40, t=20, b=40),
    height=460,
)
st.plotly_chart(fig, use_container_width=True)
