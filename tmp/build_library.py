# -*- coding: utf-8 -*-
"""
Builder script to generate 515+ verified authentic Islamic quotes, Quranic ayahs,
Sahih Hadiths, Masnoon Duas, and Islamic advice for WAZ MEDIA.
"""

import json

# We will define comprehensive verified Islamic collections
quotes = []

# --- Helper to append quote ---
def add_quote(qid, qtype, cats, ar, bn, ref, topic=""):
    quotes.append({
        "id": qid,
        "type": qtype,
        "cats": cats,
        "ar": ar,
        "bn": bn,
        "ref": ref,
        "topic": topic
    })

print("Starting generation...")
