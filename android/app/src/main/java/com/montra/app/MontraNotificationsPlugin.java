package com.montra.app;

import android.content.Intent;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

/** JS API: MontraNotifications.isEnabled(), .openSettings(), .drain(), event "notification". */
@CapacitorPlugin(name = "MontraNotifications")
public class MontraNotificationsPlugin extends Plugin {

    private static MontraNotificationsPlugin instance;

    @Override
    public void load() { instance = this; }

    static void emit(JSONObject item) {
        MontraNotificationsPlugin p = instance;
        if (p == null || !p.hasListeners("notification")) return;
        try {
            p.notifyListeners("notification", JSObject.fromJSONObject(item));
        } catch (Exception ignored) { }
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        boolean on = NotificationManagerCompat.getEnabledListenerPackages(getContext()).contains(getContext().getPackageName());
        JSObject r = new JSObject();
        r.put("enabled", on);
        call.resolve(r);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void drain(PluginCall call) {
        try {
            JSONArray q = MontraNotificationListener.drain(getContext());
            JSObject r = new JSObject();
            r.put("items", new JSArray(q.toString()));
            call.resolve(r);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
