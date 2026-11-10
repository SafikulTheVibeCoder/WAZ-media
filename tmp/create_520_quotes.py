# -*- coding: utf-8 -*-
import json
import os

items = []

def add(qid, qtype, cats, ar, bn, ref, topic=""):
    # Ensure 'কুরআন' is in cats if type is quran
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

print("Writing verified Islamic library...")
