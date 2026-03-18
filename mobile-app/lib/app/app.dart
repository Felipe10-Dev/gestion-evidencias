import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import 'session_gate.dart';

class EvidenceApp extends StatelessWidget {
  const EvidenceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestion Evidencias',
      theme: AppTheme.light(),
      debugShowCheckedModeBanner: false,
      home: const SessionGate(),
    );
  }
}
