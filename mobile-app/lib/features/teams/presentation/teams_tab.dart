import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_snackbar.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/api_service.dart';

class TeamsTab extends StatefulWidget {
  const TeamsTab({super.key, required this.token});

  final String token;

  @override
  State<TeamsTab> createState() => _TeamsTabState();
}

class _TeamsTabState extends State<TeamsTab> {
  bool _loading = true;
  bool _saving = false;
  List<ProjectModel> _projects = const [];
  final _nameCtrl = TextEditingController();
  String? _projectId;

  @override
  void initState() {
    super.initState();
    _fetchAll();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchAll() async {
    setState(() => _loading = true);
    try {
      final projects = await ApiService.getProjects(widget.token);
      if (!mounted) return;
      setState(() {
        _projects = projects;
        if (_projects.isNotEmpty &&
            (_projectId == null || _projectId!.isEmpty)) {
          _projectId = _projects.first.id;
        }
      });
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _createTeam() async {
    if (_nameCtrl.text.trim().isEmpty ||
        _projectId == null ||
        _projectId!.isEmpty) {
      showAppSnackBar(context, 'Completa nombre y proyecto');
      return;
    }

    setState(() => _saving = true);
    try {
      await ApiService.createTeam(
        token: widget.token,
        nombre: _nameCtrl.text.trim(),
        projectId: _projectId!,
      );
      _nameCtrl.clear();
      await _fetchAll();
      if (!mounted) return;
      showAppSnackBar(context, 'Equipo creado');
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.brandBlue),
      );
    }

    return RefreshIndicator(
      color: AppColors.brandBlue,
      onRefresh: _fetchAll,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          const Text(
            'CREAR EQUIPO',
            style: TextStyle(
              color: AppColors.ink300,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.8,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: AppColors.ink900.withValues(alpha: 0.07),
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.ink900.withValues(alpha: 0.05),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.brandBlue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.add_box_outlined,
                        color: AppColors.brandBlue,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Nuevo equipo',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                            color: AppColors.ink900,
                          ),
                        ),
                        Text(
                          'Asocia un equipo a un proyecto',
                          style: TextStyle(
                            color: AppColors.ink700,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                TextField(
                  controller: _nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Nombre del equipo',
                    prefixIcon: Icon(Icons.hvac, size: 20),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  key: ValueKey(_projectId ?? 'project-empty'),
                  initialValue: _projectId,
                  items: _projects
                      .map(
                        (project) => DropdownMenuItem<String>(
                          value: project.id,
                          child: Text(project.nombre),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: (value) => setState(() => _projectId = value),
                  decoration: const InputDecoration(
                    labelText: 'Proyecto',
                    prefixIcon: Icon(Icons.assignment_outlined, size: 20),
                  ),
                ),
                const SizedBox(height: 18),
                FilledButton.icon(
                  onPressed: _saving ? null : _createTeam,
                  icon: _saving
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.add, size: 18),
                  label: Text(_saving ? 'Guardando...' : 'Crear equipo'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
