import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class Api {
  static const base = String.fromEnvironment('API_BASE', defaultValue: 'http://10.0.2.2:3000');
  static const hubUrl = String.fromEnvironment('HUB_URL', defaultValue: 'https://student-hub-egypt.vercel.app');
  static const _tokenKey = 'fc_token';

  static String? _token;
  static Map<String, dynamic>? user;

  static Future<String?> loadToken() async {
    final p = await SharedPreferences.getInstance();
    _token = p.getString(_tokenKey);
    return _token;
  }

  static Future<void> _saveToken(String t) async {
    _token = t;
    final p = await SharedPreferences.getInstance();
    await p.setString(_tokenKey, t);
  }

  static Future<void> logout() async {
    _token = null;
    user = null;
    final p = await SharedPreferences.getInstance();
    await p.remove(_tokenKey);
  }

  static Map<String, String> get _headers => {
        'content-type': 'application/json',
        if (_token != null) 'authorization': 'Bearer $_token',
      };

  static Future<dynamic> _get(String path) async {
    final r = await http.get(Uri.parse('$base$path'), headers: _headers);
    if (r.statusCode == 401) throw Unauthorized();
    return jsonDecode(utf8.decode(r.bodyBytes));
  }

  static Future<dynamic> _post(String path, Map<String, dynamic> body) async {
    final r = await http.post(Uri.parse('$base$path'), headers: _headers, body: jsonEncode(body));
    if (r.statusCode == 401) throw Unauthorized();
    return jsonDecode(utf8.decode(r.bodyBytes));
  }

  // --- auth ---
  static Future<void> exchange(String code, String state) async {
    final res = await http.post(
      Uri.parse('$base/api/auth/mobile/exchange'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'code': code, 'state': state}),
    );
    final data = jsonDecode(utf8.decode(res.bodyBytes));
    if (res.statusCode != 200) throw Exception(data['error'] ?? 'auth failed');
    await _saveToken(data['token']);
    user = data['user'];
  }

  // --- data ---
  static Future<Map<String, dynamic>> bootstrap() async => await _get('/api/v1/bootstrap');
  static Future<Map<String, dynamic>> workoutToday() async => await _get('/api/v1/workout/today');
  static Future<void> saveSet(int setId, {int? reps, double? weight, bool? done}) async =>
      await _post('/api/v1/sets', {'set_id': setId, 'reps': reps, 'weight': weight, 'done': done});
  static Future<Map<String, dynamic>> routines() async => await _get('/api/v1/routines');
  static Future<void> setLevel(String level) async => await _post('/api/v1/routines', {'level': level});
  static Future<Map<String, dynamic>> checkinStatus() async => await _get('/api/v1/checkin');
  static Future<void> checkin(double lat, double lng) async => await _post('/api/v1/checkin', {'lat': lat, 'lng': lng});
  static Future<List<dynamic>> gyms() async => (await _get('/api/v1/gyms'))['gyms'];
  static Future<Map<String, dynamic>> gym(int id) async => await _get('/api/v1/gyms/$id');
  static Future<void> subscribe(int gymId, int planId) async => await _post('/api/v1/gyms/$gymId/subscribe', {'plan_id': planId});
  static Future<List<dynamic>> chatMessages() async => (await _get('/api/v1/chat'))['messages'];
  static Future<String> chatSend(String body) async => (await _post('/api/v1/chat', {'body': body}))['reply'];
  static Future<void> updateMe({String? goal, List<String>? schedule}) async =>
      await _post('/api/v1/me', {'goal': goal, 'schedule': schedule});
}

class Unauthorized implements Exception {}
