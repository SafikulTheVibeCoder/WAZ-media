# -*- coding: utf-8 -*-
"""
WAZ MEDIA - Verified Islamic Quotes Library Builder
Generates 515+ authentic, verified Quranic Ayahs, Sahih Hadiths, Masnoon Duas, and Islamic Reminders.
"""

import json
import os

items = []
seen_ids = set()

def add(qid, qtype, cats, ar, bn, ref, topic=""):
    if qid in seen_ids:
        qid = f"{qid}-{len(items)}"
    seen_ids.add(qid)
    
    # Ensure primary type is in cats
    if qtype == 'quran' and 'কুরআন' not in cats:
        cats = ['কুরআন'] + cats
    elif qtype == 'hadith' and 'হাদিস' not in cats:
        cats = ['হাদিস'] + cats
    elif qtype == 'dua' and 'দোয়া' not in cats:
        cats = ['দোয়া'] + cats
    elif qtype == 'quote' and 'ইসলামিক উপদেশ' not in cats:
        cats = ['ইসলামিক উপদেশ'] + cats

    items.append({
        "id": qid,
        "type": qtype,
        "cats": cats,
        "ar": ar.strip(),
        "bn": bn.strip(),
        "ref": ref.strip(),
        "topic": topic.strip()
    })

print("Starting generation of 515+ verified quotes...")
