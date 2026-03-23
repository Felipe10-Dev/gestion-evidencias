import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_data_refresh_bus.dart';
import '../../../core/utils/app_snackbar.dart';
import '../../../data/models/project_model.dart';
import '../../../data/models/session_user.dart';
import '../../../data/models/team_model.dart';
import '../../../data/services/api_service.dart';

class TeamsTab extends StatefulWidget {
  const TeamsTab({super.key, required this.token, required this.user});

  final String token;
  final SessionUser user;

  @override
  State<TeamsTab> createState() => _TeamsTabState();
}

class _TeamsTabState extends State<TeamsTab> {
  bool _loading = true;
  List<ProjectModel> _projects = const [];
  List<TeamModel> _teams = const [];
  final _nameCtrl = TextEditingController();
  String? _selectedProjectId;

  bool get _isAdmin => widget.user.isAdmin;
  bool get _canCreateTeam {
    final role = widget.user.rol.toLowerCase();
    return role == 'admin' || role == 'tecnico';
  }

  @override
  void initState() {
    super.initState();
    AppDataRefreshBus.revision.addListener(_handleExternalRefresh);
    _fetchAll();
  }

  @override
  void dispose() {
    AppDataRefreshBus.revision.removeListener(_handleExternalRefresh);
    _nameCtrl.dispose();
    super.dispose();
  }

  void _handleExternalRefresh() {
    if (!mounted || _loading) return;
    _fetchAll();
  }

  // ── Data ────────────────────────────────────────────────────────────────────

  Future<void> _fetchAll() async {
    setState(() => _loading = true);
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
      if (mounted) setState(() => _loading = false);
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
                  prefixIcon: Icon(Icons.hvac_outlined, size: 20),
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
    final selectedProject = _projects.where((p) => p.id == projectId).firstOrNull;

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
            gradient: const LinearGradient(
              colors: [Color(0xFFEAF2FF), Color(0xFFF5F9FF)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: AppColors.brandBlue.withValues(alpha: 0.15),
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.brandBlue.withValues(alpha: 0.08),
                blurRadius: 20,
                offset: const Offset(0, 8),
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
                    color: AppColors.brandBlue,
                    borderRadius: BorderRadius.circular(13),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.brandBlue.withValues(alpha: 0.35),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.add_circle_outline_rounded,
                    color: Colors.white,
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
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: AppColors.brandBlue.withValues(alpha: 0.9),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                team.nombre,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: AppColors.ink900,
                  letterSpacing: -0.1,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 6),
            _isAdmin
                ? PopupMenuButton<String>(
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
                  )
                : const Icon(
                    Icons.chevron_right,
                    color: AppColors.ink300,
                    size: 20,
                ),
          ],
        ),
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
                      Icons.kitchen_outlined,
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
