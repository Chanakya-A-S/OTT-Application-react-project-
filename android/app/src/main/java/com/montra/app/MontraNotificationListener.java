package com.montra.app;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.regex.Pattern;

/**
 * Listens to every notification posted on the phone and keeps only the ones that look like
 * money movements (bank SMS, UPI apps, wallets, card alerts). Matches are queued in
 * SharedPreferences so nothing is lost while the app is closed, and pushed live to the
 * web layer when the app is open. Parsing / categorising happens in JS (src/parser.js).
 */
public class MontraNotificationListener extends NotificationListenerService {

    static final String PREFS = "montra_notifications";
    static final String KEY_QUEUE = "queue";
    private static final int MAX_QUEUE = 300;

    private static final Pattern AMOUNT = Pattern.compile("(?i)(₹|rs\\.?|inr|rupees)\\s*[0-9]");
    private static final Pattern TXN = Pattern.compile(
        "(?i)(debited|credited|spent|paid|sent|received|withdrawn|purchase|deducted|transferred|refund|txn|transaction|upi)");
    private static final Pattern IGNORE = Pattern.compile("(?i)(otp|one time password|verification code)");

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            if (sbn == null || getPackageName().equals(sbn.getPackageName())) return;
            Notification n = sbn.getNotification();
            if (n == null || (n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
            Bundle e = n.extras;
            String title = str(e.getCharSequence(Notification.EXTRA_TITLE));
            String big = str(e.getCharSequence(Notification.EXTRA_BIG_TEXT));
            String text = big.isEmpty() ? str(e.getCharSequence(Notification.EXTRA_TEXT)) : big;
            String full = (text.isEmpty() ? title : text).trim();
            if (full.isEmpty() || IGNORE.matcher(full).find()) return;
            if (!AMOUNT.matcher(full).find() || !TXN.matcher(full).find()) return;

            JSONObject item = new JSONObject();
            item.put("text", full);
            item.put("title", title);
            item.put("app", appLabel(sbn.getPackageName()));
            item.put("package", sbn.getPackageName());
            item.put("time", sbn.getPostTime());

            enqueue(this, item);
            MontraNotificationsPlugin.emit(item);
        } catch (Exception ignored) { }
    }

    private String appLabel(String pkg) {
        try {
            return getPackageManager().getApplicationLabel(getPackageManager().getApplicationInfo(pkg, 0)).toString();
        } catch (Exception ex) {
            return pkg;
        }
    }

    private static String str(CharSequence c) { return c == null ? "" : c.toString(); }

    static synchronized void enqueue(Context ctx, JSONObject item) throws Exception {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, MODE_PRIVATE);
        JSONArray q = new JSONArray(p.getString(KEY_QUEUE, "[]"));
        for (int i = 0; i < q.length(); i++) {
            if (q.getJSONObject(i).optString("text").equals(item.optString("text"))) return; // duplicate
        }
        q.put(item);
        while (q.length() > MAX_QUEUE) q.remove(0);
        p.edit().putString(KEY_QUEUE, q.toString()).apply();
    }

    static synchronized JSONArray drain(Context ctx) throws Exception {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, MODE_PRIVATE);
        JSONArray q = new JSONArray(p.getString(KEY_QUEUE, "[]"));
        p.edit().putString(KEY_QUEUE, "[]").apply();
        return q;
    }
}
