import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/session_user.dart';
import '../../../data/services/session_store.dart';
import '../../auth/presentation/login_screen.dart';
import '../../evidences/presentation/upload_evidence_tab.dart';
import '../../projects/presentation/projects_tab.dart';
import '../../teams/presentation/teams_tab.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.token, this.initialUser});

  final String token;
  final SessionUser? initialUser;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;
  SessionUser _user = const SessionUser.empty();

  @override
  void initState() {
    super.initState();
    _user = widget.initialUser ?? const SessionUser.empty();
    if (!_user.hasData) {
      _loadUser();
    }
  }

  Future<void> _loadUser() async {
    final user = await SessionStore.getUser();
    if (!mounted || user == null) return;
    setState(() => _user = user);
  }

  Future<void> _logout() async {
    await SessionStore.clear();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  void _showProfile(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.ink900.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.brandBlue, AppColors.brandBlueDeep],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.brandBlue.withValues(alpha: 0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: const Icon(
                Icons.person_rounded,
                color: Colors.white,
                size: 32,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              _user.nombre.isNotEmpty ? _user.nombre : 'Usuario',
              style: const TextStyle(
                color: AppColors.ink900,
                fontSize: 20,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.brandBlue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _user.rolLabel,
                style: const TextStyle(
                  color: AppColors.brandBlue,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _logout();
                },
                icon: const Icon(Icons.logout_rounded, size: 18),
                label: const Text('Cerrar sesión'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.danger,
                  side: const BorderSide(color: AppColors.danger, width: 1.2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tabs = [
      ProjectsTab(token: widget.token, user: _user),
      TeamsTab(token: widget.token),
      UploadEvidenceTab(token: widget.token),
    ];

    return Scaffold(
      backgroundColor: AppColors.surfaceSoft,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleSpacing: 20,
        title: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.brandBlue, AppColors.brandBlueDeep],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.photo_library_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              'Evidencias',
              style: TextStyle(
                color: AppColors.ink900,
                fontSize: 20,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => _showProfile(context),
            icon: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: AppColors.brandBlue.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.person_outline_rounded,
                color: AppColors.brandBlue,
                size: 20,
              ),
            ),
            tooltip: 'Mi perfil',
          ),
          const SizedBox(width: 8),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: AppColors.ink900.withValues(alpha: 0.07),
          ),
        ),
      ),
      body: tabs[_tab],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: AppColors.ink900.withValues(alpha: 0.07)),
          ),
        ),
        child: NavigationBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          indicatorColor: AppColors.brandBlue.withValues(alpha: 0.12),
          selectedIndex: _tab,
          onDestinationSelected: (value) => setState(() => _tab = value),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.assignment_outlined),
              selectedIcon: Icon(Icons.assignment, color: AppColors.brandBlue),
              label: 'Proyectos',
            ),
            NavigationDestination(
              icon: Icon(Icons.kitchen_outlined),
              selectedIcon: Icon(Icons.kitchen, color: AppColors.brandBlue),
              label: 'Equipos',
            ),
            NavigationDestination(
              icon: Icon(Icons.cloud_upload_outlined),
              selectedIcon: Icon(
                Icons.cloud_upload,
                color: AppColors.brandBlue,
              ),
              label: 'Evidencia',
            ),
          ],
        ),
      ),
    );
  }
}
