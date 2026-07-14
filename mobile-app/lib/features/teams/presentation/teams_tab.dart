import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_data_refresh_bus.dart';
import '../../../core/utils/app_snackbar.dart';
import '../../../data/models/project_model.dart';
import '../../../data/models/drive_reference_model.dart';
import '../../../data/models/session_user.dart';
import '../../../data/models/team_model.dart';
import '../../../data/services/api_service.dart';

class _TeamReferencesState {
  bool expanded = false;
  bool loading = false;
  List<DriveReferenceModel> references = const [];
  String? error;
}

class TeamsTab extends StatefulWidget {
  const TeamsTab({super.key, required this.token, required this.user});

  final String token;
  final SessionUser user;

  @override
  State<TeamsTab> createState() => _TeamsTabState();
}

class _TeamsTabState extends State<TeamsTab> {
  static const Duration _backgroundRefreshInterval = Duration(seconds: 15);

  bool _loading = true;
  List<ProjectModel> _projects = const [];
  List<TeamModel> _teams = const [];
  final _nameCtrl = TextEditingController();
  final _referenceNameCtrl = TextEditingController();
  String? _selectedProjectId;
  Timer? _autoRefreshTimer;
  final Map<String, _TeamReferencesState> _teamReferences = {};

  bool get _isAdmin => widget.user.isAdmin;
  bool get _canCreateTeam {
    final role = widget.user.rol.trim().toLowerCase();
    return role == 'admin' || role == 'tecnico' || role == 'técnico';
  }

  @override
  void initState() {
    super.initState();
    AppDataRefreshBus.revision.addListener(_handleExternalRefresh);
    _fetchAll();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    AppDataRefreshBus.revision.removeListener(_handleExternalRefresh);
    _nameCtrl.dispose();
    _referenceNameCtrl.dispose();
    super.dispose();
  }

  _TeamReferencesState _getRefsState(String teamId) {
    return _teamReferences.putIfAbsent(teamId, () => _TeamReferencesState());
  }

  void _handleExternalRefresh() {
    if (!mounted || _loading) return;
    _fetchAll(showLoader: false);
  }

  void _startAutoRefresh() {
    _autoRefreshTimer?.cancel();
    _autoRefreshTimer = Timer.periodic(_backgroundRefreshInterval, (_) {
      if (!mounted || _loading) return;
      _fetchAll(showLoader: false);
    });
  }

  // ── Data ────────────────────────────────────────────────────────────────────

  Future<void> _fetchAll({bool showLoader = true}) async {
    if (showLoader && mounted) {
      setState(() => _loading = true);
    }
    try {
      final results = await Future.wait([
        ApiService.getProjects(widget.token),
        ApiService.getTeams(widget.token),
      ]);
      if (!mounted) return;
      final projects = results[0] as List<ProjectModel>;
      final teams = results[1] as List<TeamModel>;
      setState(() {
        _projects = projects;
        _teams = teams;
        if (_selectedProjectId == null && projects.isNotEmpty) {
          _selectedProjectId = projects.first.id;
        }
      });
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    } finally {
      if (showLoader && mounted) setState(() => _loading = false);
    }
  }

  // ── References (Drive subfolders) ───────────────────────────────────────────

  Future<void> _ensureTeamReferencesLoaded(
    String teamId, {
    bool force = false,
  }) async {
    final state = _getRefsState(teamId);
    if (state.loading) return;
    if (!force && state.references.isNotEmpty) return;

    if (mounted) {
      setState(() {
        state.loading = true;
        state.error = null;
      });
    }

    try {
      final references = await ApiService.getTeamSubfolders(
        token: widget.token,
        teamId: teamId,
      );
      if (!mounted) return;
      setState(() {
        state.references = references;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        state.error = normalizeError(error);
      });
    } finally {
      if (!mounted) return;
      setState(() {
        state.loading = false;
      });
    }
  }

  Future<void> _toggleTeamExpanded(TeamModel team) async {
    final state = _getRefsState(team.id);
    setState(() {
      state.expanded = !state.expanded;
    });
    if (state.expanded) {
      await _ensureTeamReferencesLoaded(team.id);
    }
  }

  Future<void> _showEditReferenceSheet({
    required TeamModel team,
    required DriveReferenceModel reference,
  }) async {
    _referenceNameCtrl.text = reference.name;
    var saving = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => AnimatedPadding(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(sheetCtx).viewInsets.bottom,
        ),
        child: StatefulBuilder(
          builder: (ctx, setSS) {
            Future<void> submit() async {
              final nombre = _referenceNameCtrl.text.trim();
              if (nombre.isEmpty) {
                showAppSnackBar(ctx, 'Escribe el nombre de la referencia');
                return;
              }

              setSS(() => saving = true);
              try {
                final updated = await ApiService.renameDriveFolder(
                  token: widget.token,
                  folderId: reference.id,
                  nombre: nombre,
                );

                final state = _getRefsState(team.id);
                final idx = state.references.indexWhere((r) => r.id == reference.id);
                if (idx != -1) {
                  final next = [...state.references];
                  next[idx] = updated;
                  if (mounted) {
                    setState(() {
                      state.references = next;
                    });
                  }
                }

                if (!ctx.mounted) return;
                Navigator.of(ctx).pop();
                showAppSnackBar(context, 'Referencia actualizada');
              } catch (error) {
                if (ctx.mounted) showAppSnackBar(ctx, normalizeError(error));
              } finally {
                if (ctx.mounted) setSS(() => saving = false);
              }
            }

            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: SafeArea(
                top: false,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 14, 24, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Center(
                        child: Container(
                          width: 42,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.ink900.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppColors.brandBlue.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(
                              Icons.drive_file_rename_outline,
                              color: AppColors.brandBlue,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          const Text(
                            'Editar referencia',
                            style: TextStyle(
                              color: AppColors.ink900,
                              fontWeight: FontWeight.w700,
                              fontSize: 20,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      TextField(
                        controller: _referenceNameCtrl,
                        textInputAction: TextInputAction.done,
                        decoration: const InputDecoration(
                          labelText: 'Nombre de la referencia',
                          prefixIcon: Icon(Icons.folder_outlined, size: 20),
                        ),
                      ),
                      const SizedBox(height: 18),
                      FilledButton.icon(
                        onPressed: saving ? null : submit,
                        icon: saving
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.check_circle_outline, size: 18),
                        label: Text(saving ? 'Guardando...' : 'Guardar cambios'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _showDeleteReferenceConfirm({
    required TeamModel team,
    required DriveReferenceModel reference,
  }) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dlgCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: AppColors.danger.withValues(alpha: 0.08),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.delete_outline, color: AppColors.danger, size: 26),
        ),
        title: const Text(
          'Eliminar referencia',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: AppColors.ink900,
          ),
        ),
        content: Text(
          '¿Seguro que deseas eliminar "${reference.name}"? Se eliminará la carpeta en Drive.',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.ink700, fontSize: 14),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        actions: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.of(dlgCtx).pop(false),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.ink700,
                    side: BorderSide(
                      color: AppColors.ink900.withValues(alpha: 0.15),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Cancelar'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () => Navigator.of(dlgCtx).pop(true),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.danger,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Eliminar'),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ApiService.deleteDriveFolder(
        token: widget.token,
        folderId: reference.id,
      );

      final state = _getRefsState(team.id);
      final next = state.references.where((r) => r.id != reference.id).toList();
      if (mounted) {
        setState(() {
          state.references = next;
        });
      }
      if (!mounted) return;
      showAppSnackBar(context, 'Referencia eliminada');
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    }
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  Future<void> _showCreateTeamSheet() async {
    _nameCtrl.clear();
    var sheetProjectId = _selectedProjectId;
    var saving = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => AnimatedPadding(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(sheetCtx).viewInsets.bottom,
        ),
        child: StatefulBuilder(
          builder: (ctx, setSS) {
            Future<void> submit() async {
              final nombre = _nameCtrl.text.trim();
              if (nombre.isEmpty || sheetProjectId == null) {
                showAppSnackBar(ctx, 'Completa nombre y proyecto');
                return;
              }
              setSS(() => saving = true);
              try {
                await ApiService.createTeam(
                  token: widget.token,
                  nombre: nombre,
                  projectId: sheetProjectId!,
                );
                _nameCtrl.clear();
                if (!ctx.mounted) return;
                Navigator.of(ctx).pop();
                await _fetchAll();
                AppDataRefreshBus.notifyChanged();
                if (!ctx.mounted) return;
                showAppSnackBar(ctx, 'Equipo creado');
              } catch (error) {
                if (ctx.mounted) showAppSnackBar(ctx, normalizeError(error));
              } finally {
                if (ctx.mounted) setSS(() => saving = false);
              }
            }

            return _buildSheetScaffold(
              icon: Icons.add_circle_outline_rounded,
              title: 'Nuevo equipo',
              projectId: sheetProjectId,
              onProjectChanged: (v) => setSS(() => sheetProjectId = v),
              saving: saving,
              onSubmit: submit,
              submitLabel: 'Crear equipo',
            );
          },
        ),
      ),
    );
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  Future<void> _showEditTeamSheet(TeamModel team) async {
    _nameCtrl.text = team.nombre;
    var saving = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => AnimatedPadding(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(sheetCtx).viewInsets.bottom,
        ),
        child: StatefulBuilder(
          builder: (ctx, setSS) {
            Future<void> submit() async {
              final nombre = _nameCtrl.text.trim();
              if (nombre.isEmpty) {
                showAppSnackBar(ctx, 'Escribe el nombre del equipo');
                return;
              }
              setSS(() => saving = true);
              try {
                await ApiService.updateTeam(
                  token: widget.token,
                  id: team.id,
                  nombre: nombre,
                );
                _nameCtrl.clear();
                if (!ctx.mounted) return;
                Navigator.of(ctx).pop();
                await _fetchAll();
                AppDataRefreshBus.notifyChanged();
                if (!ctx.mounted) return;
                showAppSnackBar(ctx, 'Equipo actualizado');
              } catch (error) {
                if (ctx.mounted) showAppSnackBar(ctx, normalizeError(error));
              } finally {
                if (ctx.mounted) setSS(() => saving = false);
              }
            }

            return _buildSheetScaffold(
              icon: Icons.edit_outlined,
              title: 'Editar equipo',
              saving: saving,
              onSubmit: submit,
              submitLabel: 'Guardar cambios',
            );
          },
        ),
      ),
    );
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  Future<void> _showDeleteConfirm(TeamModel team) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dlgCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: AppColors.danger.withValues(alpha: 0.08),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.delete_outline, color: AppColors.danger, size: 26),
        ),
        title: const Text(
          'Eliminar equipo',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: AppColors.ink900,
          ),
        ),
        content: Text(
          '¿Seguro que deseas eliminar "${team.nombre}"? Esta acción no se puede deshacer.',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.ink700, fontSize: 14),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        actions: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.of(dlgCtx).pop(false),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.ink700,
                    side: BorderSide(
                      color: AppColors.ink900.withValues(alpha: 0.15),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Cancelar'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () => Navigator.of(dlgCtx).pop(true),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.danger,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Eliminar'),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ApiService.deleteTeam(token: widget.token, id: team.id);
      if (!mounted) return;
      await _fetchAll();
      AppDataRefreshBus.notifyChanged();
      if (!mounted) return;
      showAppSnackBar(context, 'Equipo eliminado');
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    }
  }

  // ── Shared sheet scaffold ────────────────────────────────────────────────────

  Widget _buildSheetScaffold({
    required IconData icon,
    required String title,
    String? projectId,
    ValueChanged<String?>? onProjectChanged,
    required bool saving,
    required Future<void> Function() onSubmit,
    required String submitLabel,
  }) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 14, 24, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.ink900.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.brandBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(icon, color: AppColors.brandBlue, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.ink900,
                      fontWeight: FontWeight.w700,
                      fontSize: 20,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _nameCtrl,
                textInputAction: TextInputAction.done,
                decoration: const InputDecoration(
                  labelText: 'Nombre del equipo',
                  prefixIcon: Icon(Icons.handyman_outlined, size: 20),
                ),
              ),
              if (onProjectChanged != null) ...[  
                const SizedBox(height: 12),
                _buildProjectSelectorField(
                  projectId: projectId,
                  onProjectChanged: onProjectChanged,
                ),
              ],
              const SizedBox(height: 18),
              FilledButton.icon(
                onPressed: saving ? null : onSubmit,
                icon: saving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.check_circle_outline, size: 18),
                label: Text(saving ? 'Guardando...' : submitLabel),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProjectSelectorField({
    required String? projectId,
    required ValueChanged<String?> onProjectChanged,
  }) {
    ProjectModel? selectedProject;
    for (final project in _projects) {
      if (project.id == projectId) {
        selectedProject = project;
        break;
      }
    }

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () async {
        FocusManager.instance.primaryFocus?.unfocus();
        final selected = await _showProjectPickerSheet(projectId);
        if (selected != null) {
          onProjectChanged(selected);
        }
      },
      child: InputDecorator(
        decoration: const InputDecoration(
          labelText: 'Proyecto',
          prefixIcon: Icon(Icons.assignment_outlined, size: 20),
          suffixIcon: Icon(Icons.expand_more_rounded),
        ),
        child: Text(
          selectedProject?.nombre ?? 'Selecciona un proyecto',
          style: TextStyle(
            color: selectedProject == null ? AppColors.ink300 : AppColors.ink900,
            fontWeight: selectedProject == null ? FontWeight.w500 : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Future<String?> _showProjectPickerSheet(String? currentProjectId) {
    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.ink900.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 14),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Selecciona un proyecto',
                    style: TextStyle(
                      color: AppColors.ink900,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _projects.length,
                  separatorBuilder: (_, __) => Divider(
                    height: 1,
                    color: AppColors.ink900.withValues(alpha: 0.06),
                  ),
                  itemBuilder: (_, index) {
                    final project = _projects[index];
                    final selected = project.id == currentProjectId;
                    return ListTile(
                      title: Text(project.nombre),
                      trailing: selected
                          ? const Icon(
                              Icons.check_circle,
                              color: AppColors.brandBlue,
                              size: 20,
                            )
                          : null,
                      onTap: () => Navigator.of(ctx).pop(project.id),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── UI builders ──────────────────────────────────────────────────────────────

  Widget _buildAdminCreateBanner() {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: _showCreateTeamSheet,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: AppColors.ink900.withValues(alpha: 0.06),
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.ink900.withValues(alpha: 0.04),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.brandBlue.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: const Icon(
                    Icons.add_circle_outline_rounded,
                    color: AppColors.brandBlue,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Text(
                    'Nuevo equipo',
                    style: TextStyle(
                      color: AppColors.ink900,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: AppColors.brandBlue,
                  size: 15,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCreateCallToAction() {
    if (!_canCreateTeam) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: _buildAdminCreateBanner(),
    );
  }

  Widget _buildTeamsHeader() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.ink900.withValues(alpha: 0.05)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'EQUIPOS',
                    style: TextStyle(
                      color: AppColors.ink300,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.8,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${_projects.length} proyectos activos',
                    style: const TextStyle(
                      color: AppColors.ink700,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.brandBlue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                '${_teams.length}',
                style: const TextStyle(
                  color: AppColors.brandBlue,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTeamCard(TeamModel team) {
    final refsState = _getRefsState(team.id);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.ink900.withValues(alpha: 0.06)),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink900.withValues(alpha: 0.02),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () => _toggleTeamExpanded(team),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: AppColors.brandBlue.withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.handyman_outlined,
                      color: AppColors.brandBlue,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      team.nombre,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: AppColors.ink900,
                        letterSpacing: -0.1,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (_canCreateTeam)
                    PopupMenuButton<String>(
                      icon: const Icon(
                        Icons.more_vert,
                        color: AppColors.ink300,
                        size: 22,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      onSelected: (value) {
                        if (value == 'edit') _showEditTeamSheet(team);
                        if (value == 'delete') _showDeleteConfirm(team);
                      },
                      itemBuilder: (_) => [
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(
                                Icons.edit_outlined,
                                color: AppColors.brandBlue,
                                size: 18,
                              ),
                              SizedBox(width: 10),
                              Text('Editar'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(
                                Icons.delete_outline,
                                color: AppColors.danger,
                                size: 18,
                              ),
                              SizedBox(width: 10),
                              Text(
                                'Eliminar',
                                style: TextStyle(color: AppColors.danger),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  Icon(
                    refsState.expanded
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: AppColors.ink300,
                    size: 22,
                  ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Divider(
                    height: 1,
                    color: AppColors.ink900.withValues(alpha: 0.06),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(
                        Icons.folder_outlined,
                        size: 18,
                        color: AppColors.ink300,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Referencias',
                        style: TextStyle(
                          color: AppColors.ink900,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        tooltip: 'Recargar',
                        onPressed: () => _ensureTeamReferencesLoaded(team.id, force: true),
                        icon: const Icon(
                          Icons.refresh_rounded,
                          size: 20,
                          color: AppColors.ink300,
                        ),
                      ),
                    ],
                  ),
                  if (refsState.loading)
                    const Padding(
                      padding: EdgeInsets.only(top: 6, bottom: 6),
                      child: Center(
                        child: SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.brandBlue,
                          ),
                        ),
                      ),
                    )
                  else if (refsState.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        refsState.error!,
                        style: const TextStyle(
                          color: AppColors.danger,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    )
                  else if (refsState.references.isEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        'Aún no hay referencias en este equipo.',
                        style: TextStyle(
                          color: AppColors.ink700.withValues(alpha: 0.9),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    )
                  else
                    ...refsState.references.map(
                      (ref) => Container(
                        margin: const EdgeInsets.only(top: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.ink900.withValues(alpha: 0.02),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.ink900.withValues(alpha: 0.05),
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.folder_open_outlined,
                              size: 18,
                              color: AppColors.brandBlue,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                ref.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.ink900,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            IconButton(
                              tooltip: 'Editar',
                              onPressed: () => _showEditReferenceSheet(
                                team: team,
                                reference: ref,
                              ),
                              icon: const Icon(
                                Icons.edit_outlined,
                                size: 20,
                                color: AppColors.ink300,
                              ),
                            ),
                            IconButton(
                              tooltip: 'Eliminar',
                              onPressed: () => _showDeleteReferenceConfirm(
                                team: team,
                                reference: ref,
                              ),
                              icon: const Icon(
                                Icons.delete_outline,
                                size: 20,
                                color: AppColors.danger,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            crossFadeState: refsState.expanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 180),
          ),
        ],
      ),
    );
  }

  // ── Grouped sections ──────────────────────────────────────────────────────────

  List<Widget> _buildGroupedSections() {
    final Map<String, List<TeamModel>> grouped = {};
    for (final team in _teams) {
      grouped.putIfAbsent(team.projectId, () => []).add(team);
    }

    final sections = <Widget>[];

    for (final project in _projects) {
      final teams = grouped[project.id];
      if (teams == null || teams.isEmpty) continue;

      sections.add(
        Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppColors.ink900.withValues(alpha: 0.06),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    width: 3,
                    height: 20,
                    decoration: BoxDecoration(
                      color: AppColors.brandBlue,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      project.nombre,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.ink900,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.brandBlue.withValues(alpha: 0.09),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${teams.length}',
                      style: const TextStyle(
                        color: AppColors.brandBlue,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ...teams.map(
                (team) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _buildTeamCard(team),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return sections;
  }

  // ── Build ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.brandBlue),
      );
    }

    if (_teams.isEmpty) {
      return RefreshIndicator(
        color: AppColors.brandBlue,
        onRefresh: _fetchAll,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          children: [
            _buildCreateCallToAction(),
            const SizedBox(height: 36),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: AppColors.ink900.withValues(alpha: 0.06),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: AppColors.brandBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                        Icons.handyman_outlined,
                      size: 28,
                      color: AppColors.brandBlue,
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Sin equipos aún',
                    style: TextStyle(
                      color: AppColors.ink900,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _isAdmin
                        ? 'Crea el primer equipo para organizar las evidencias.'
                      : _canCreateTeam
                        ? 'Crea el primer equipo para organizar las evidencias.'
                        : 'Aún no hay equipos asignados para mostrar.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: AppColors.ink700,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.brandBlue,
      onRefresh: _fetchAll,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          _buildCreateCallToAction(),
          _buildTeamsHeader(),
          ..._buildGroupedSections(),
        ],
      ),
    );
  }
}
