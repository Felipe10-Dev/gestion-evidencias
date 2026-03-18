import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_session.dart';
import '../models/session_user.dart';

class SessionStore {
  static const _tokenKey = 'token';
  static const _nombreKey = 'user_nombre';
  static const _rolKey = 'user_rol';

  static Future<void> saveSession(AuthSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, session.token);
    await prefs.setString(_nombreKey, session.user.nombre);
    await prefs.setString(_rolKey, session.user.rol);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<SessionUser?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final nombre = prefs.getString(_nombreKey);
    final rol = prefs.getString(_rolKey);

    if ((nombre == null || nombre.isEmpty) && (rol == null || rol.isEmpty)) {
      return null;
    }

    return SessionUser(nombre: nombre ?? '', rol: rol ?? '');
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_nombreKey);
    await prefs.remove(_rolKey);
  }
}
