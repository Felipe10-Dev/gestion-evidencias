import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/auth_session.dart';
import '../models/drive_reference_model.dart';
import '../models/project_model.dart';
import '../models/session_user.dart';
import '../models/team_model.dart';

class ApiService {
  static const String _apiUrlOverride = String.fromEnvironment('API_URL');

  static String get baseUrl {
    if (_apiUrlOverride.isNotEmpty) {
      return _apiUrlOverride;
    }

    if (kIsWeb) {
      return 'http://localhost:3000/api';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
  }

  static Map<String, String> _headers(String token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  static Uri _uri(String path) => Uri.parse('$baseUrl$path');

  static Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      _uri('/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final data = _tryDecodeMap(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final token = (data['token'] ?? '').toString();
      if (token.isEmpty) {
        throw Exception('El backend no devolvio token en login');
      }

      return AuthSession(
        token: token,
        user: SessionUser(
          nombre: (data['user']?['nombre'] ?? '').toString(),
          rol: (data['user']?['rol'] ?? '').toString(),
        ),
      );
    }

    throw Exception(
      (data['message'] ?? 'No se pudo iniciar sesion').toString(),
    );
  }

  static Future<List<ProjectModel>> getProjects(String token) async {
    final response = await http.get(
      _uri('/projects'),
      headers: _headers(token),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return _tryDecodeList(
        response.body,
      ).map(ProjectModel.fromJson).toList(growable: false);
    }

    throw Exception('No se pudieron cargar proyectos');
  }

  static Future<List<TeamModel>> getTeams(String token) async {
    final response = await http.get(_uri('/teams'), headers: _headers(token));

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return _tryDecodeList(
        response.body,
      ).map(TeamModel.fromJson).toList(growable: false);
    }

    throw Exception('No se pudieron cargar equipos');
  }

  static Future<List<DriveReferenceModel>> getTeamSubfolders({
    required String token,
    required String teamId,
  }) async {
    final response = await http.get(
      _uri('/evidences/team/$teamId/subfolders'),
      headers: _headers(token),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return _tryDecodeList(
        response.body,
      ).map(DriveReferenceModel.fromJson).toList(growable: false);
    }

    throw Exception('No se pudieron cargar subcarpetas del equipo');
  }

  static Future<void> createTeam({
    required String token,
    required String nombre,
    required String projectId,
  }) async {
    final response = await http.post(
      _uri('/teams'),
      headers: _headers(token),
      body: jsonEncode({'nombre': nombre, 'projectId': projectId}),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }

    final body = _tryDecodeMap(response.body);
    throw Exception((body['error'] ?? 'No se pudo crear equipo').toString());
  }

  static Future<void> uploadEvidence({
    required String token,
    required String teamId,
    required String etapa,
    String? referencia,
    required File imageFile,
  }) async {
    final request = http.MultipartRequest('POST', _uri('/evidences'));

    request.headers['Authorization'] = 'Bearer $token';
    request.fields['teamId'] = teamId;
    request.fields['etapa'] = etapa;
    if (referencia != null && referencia.trim().isNotEmpty) {
      request.fields['referencia'] = referencia.trim();
    }
    request.files.add(
      await http.MultipartFile.fromPath('archivo', imageFile.path),
    );

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }

    final body = _tryDecodeMap(response.body);
    throw Exception(
      (body['error'] ?? body['message'] ?? 'No se pudo subir evidencia')
          .toString(),
    );
  }

  static Map<String, dynamic> _tryDecodeMap(String body) {
    try {
      final decoded = jsonDecode(body);
      return decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
    } catch (_) {
      return <String, dynamic>{};
    }
  }

  static List<Map<String, dynamic>> _tryDecodeList(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is List) {
        return decoded
            .whereType<Map>()
            .map((item) => item.cast<String, dynamic>())
            .toList();
      }
      return <Map<String, dynamic>>[];
    } catch (_) {
      return <Map<String, dynamic>>[];
    }
  }
}
