/**
 * Games Hub - spaced repetition (Leitner boxes).
 * Box 0 = new/failed (due now), boxes 1..5 = review after INTERVALS[box] days.
 * Right answer: box+1 (max 5). Wrong answer: back to box 0 (due again in the same session).
 * Pure functions + a small localStorage-backed store keyed per user/player.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.PlatformSRS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var DAY = 86400000;
    var INTERVALS = [0, 1, 3, 7, 16, 35]; // days per box
    var MAX_BOX = 5;

    function review(card, correct, now) {
        now = now || Date.now();
        var box = card && typeof card.box === 'number' ? card.box : 0;
        var next = correct ? Math.min(MAX_BOX, box + 1) : 0;
        return {
            box: next,
            due: now + INTERVALS[next] * DAY,
            seen: ((card && card.seen) || 0) + 1,
            right: ((card && card.right) || 0) + (correct ? 1 : 0),
            last: now
        };
    }

    function isDue(card, now) {
        now = now || Date.now();
        return !card || card.due <= now;
    }

    // ids: all card ids of a deck. Returns due ids: failed/due first (lowest box), then brand new ones.
    function pick(ids, cards, limit, newLimit, now) {
        now = now || Date.now();
        cards = cards || {};
        var due = [], fresh = [];
        ids.forEach(function (id) {
            var c = cards[id];
            if (!c) fresh.push(id);
            else if (c.due <= now) due.push(id);
        });
        due.sort(function (a, b) { return cards[a].box - cards[b].box || cards[a].due - cards[b].due; });
        var out = due.slice(0, limit);
        if (out.length < limit) out = out.concat(fresh.slice(0, Math.min(newLimit == null ? 5 : newLimit, limit - out.length)));
        return out;
    }

    function summary(ids, cards, now) {
        now = now || Date.now();
        cards = cards || {};
        var s = { total: ids.length, fresh: 0, due: 0, learning: 0, mastered: 0 };
        ids.forEach(function (id) {
            var c = cards[id];
            if (!c) s.fresh++;
            else {
                if (c.due <= now) s.due++;
                if (c.box >= 4) s.mastered++; else s.learning++;
            }
        });
        return s;
    }

    function store(key) {
        function read() { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } }
        function write(v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
        return {
            all: read,
            answer: function (id, correct, now) { var d = read(); d[id] = review(d[id], correct, now); write(d); return d[id]; },
            reset: function () { try { localStorage.removeItem(key); } catch (e) {} }
        };
    }

    return { INTERVALS: INTERVALS, MAX_BOX: MAX_BOX, review: review, isDue: isDue, pick: pick, summary: summary, store: store };
});
