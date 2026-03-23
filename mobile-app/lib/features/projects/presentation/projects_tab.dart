import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_data_refresh_bus.dart';
import '../../../core/utils/app_snackbar.dart';
import '../../../data/models/project_model.dart';
import '../../../data/models/session_user.dart';
import '../../../data/services/api_service.dart';

class ProjectsTab extends StatefulWidget {
  const ProjectsTab({super.key, required this.token, required this.user});

  final String token;
  final SessionUser user;

  @override
  State<ProjectsTab> createState() => _ProjectsTabState();
}

class _ProjectsTabState extends State<ProjectsTab> {
  static const Duration _backgroundRefreshInterval = Duration(seconds: 15);

  bool _loading = true;
  List<ProjectModel> _projects = const [];
  final _nameCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  Timer? _autoRefreshTimer;

  bool get _isAdmin => widget.user.isAdmin;

  @override
  void initState() {
    super.initState();
    AppDataRefreshBus.revision.addListener(_handleExternalRefresh);
    _fetch();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    AppDataRefreshBus.revision.removeListener(_handleExternalRefresh);
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  void _handleExternalRefresh() {
    if (!mounted || _loading) return;
    _fetch(showLoader: false);
  }

  void _startAutoRefresh() {
    _autoRefreshTimer?.cancel();
    _autoRefreshTimer = Timer.periodic(_backgroundRefreshInterval, (_) {
      if (!mounted || _loading) return;
      _fetch(showLoader: false);
    });
  }

  Future<void> _fetch({bool showLoader = true}) async {
    if (showLoader && mounted) {
      setState(() => _loading = true);
    }
    try {
      final data = await ApiService.getProjects(widget.token);
      if (!mounted) return;
      setState(() => _projects = data);
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    } finally {
      if (showLoader && mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _createProject() async {
    final nombre = _nameCtrl.text.trim();
    final descripcion = _descriptionCtrl.text.trim();

    if (nombre.isEmpty) {
      showAppSnackBar(context, 'Ingresa el nombre del proyecto');
      return;
    }

    try {
      await ApiService.createProject(
        token: widget.token,
        nombre: nombre,
        descripcion: descripcion,
      );
      _nameCtrl.clear();
      _descriptionCtrl.clear();
      if (!mounted) return;
      Navigator.of(context).pop();
      await _fetch();
      AppDataRefreshBus.notifyChanged();
      if (!mounted) return;
      showAppSnackBar(context, 'Proyecto creado');
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    }
  }

  Future<void> _showCreateProjectSheet() async {
    _nameCtrl.clear();
    _descriptionCtrl.clear();
    var saving = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(sheetContext).viewInsets.bottom,
          ),
          child: StatefulBuilder(
            builder: (context, setSheetState) {
              Future<void> submit() async {
                setSheetState(() => saving = true);
                try {
                  await _createProject();
                } finally {
                  if (context.mounted) {
                    setSheetState(() => saving = false);
                  }
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
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.brandBlue.withValues(alpha: 0.12),
                                AppColors.brandBlueDeep.withValues(alpha: 0.08),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(
                                  Icons.add_business_rounded,
                                  color: AppColors.brandBlue,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 14),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Nuevo proyecto',
                                      style: TextStyle(
                                        color: AppColors.ink900,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 20,
                                      ),
                                    ),

                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),
                        TextField(
                          controller: _nameCtrl,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Nombre del proyecto',
                            prefixIcon: Icon(
                              Icons.assignment_outlined,
                              size: 20,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _descriptionCtrl,
                          minLines: 3,
                          maxLines: 4,
                          decoration: const InputDecoration(
                            labelText: 'Descripcion',
                            alignLabelWithHint: true,
                            prefixIcon: Icon(Icons.notes_outlined, size: 20),
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
                              : const Icon(Icons.add_circle_outline, size: 18),
                          label: Text(
                            saving ? 'Guardando...' : 'Crear proyecto',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildAdminCreateBanner() {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: _showCreateProjectSheet,
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
                    Icons.add_business_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Text(
                    'Nuevo proyecto',
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

  // ── Edit ─────────────────────────────────────────────────────────────────

  Future<void> _showEditProjectSheet(ProjectModel project) async {
    _nameCtrl.text = project.nombre;
    _descriptionCtrl.text = project.descripcion;
    var saving = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(sheetContext).viewInsets.bottom,
          ),
          child: StatefulBuilder(
            builder: (context, setSheetState) {
              Future<void> submit() async {
                final nombre = _nameCtrl.text.trim();
                if (nombre.isEmpty) {
                  showAppSnackBar(context, 'Ingresa el nombre del proyecto');
                  return;
                }
                setSheetState(() => saving = true);
                try {
                  await ApiService.updateProject(
                    token: widget.token,
                    id: project.id,
                    nombre: nombre,
                    descripcion: _descriptionCtrl.text.trim(),
                  );
                  _nameCtrl.clear();
                  _descriptionCtrl.clear();
                  if (!context.mounted) return;
                  Navigator.of(context).pop();
                  await _fetch();
                  AppDataRefreshBus.notifyChanged();
                  if (!context.mounted) return;
                  showAppSnackBar(context, 'Proyecto actualizado');
                } catch (error) {
                  if (context.mounted) showAppSnackBar(context, normalizeError(error));
                } finally {
                  if (context.mounted) setSheetState(() => saving = false);
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
                              child: const Icon(
                                Icons.edit_outlined,
                                color: AppColors.brandBlue,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 14),
                            const Text(
                              'Editar proyecto',
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
                          controller: _nameCtrl,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Nombre del proyecto',
                            prefixIcon: Icon(Icons.assignment_outlined, size: 20),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _descriptionCtrl,
                          minLines: 3,
                          maxLines: 4,
                          decoration: const InputDecoration(
                            labelText: 'Descripcion',
                            alignLabelWithHint: true,
                            prefixIcon: Icon(Icons.notes_outlined, size: 20),
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
        );
      },
    );
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  Future<void> _showDeleteConfirm(ProjectModel project) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          icon: Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.danger.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.delete_outline,
              color: AppColors.danger,
              size: 26,
            ),
          ),
          title: const Text(
            'Eliminar proyecto',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 18,
              color: AppColors.ink900,
            ),
          ),
          content: Text(
            '\u00BFSeguro que deseas eliminar "${project.nombre}"? Esta acción no se puede deshacer.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.ink700, fontSize: 14),
          ),
          actionsPadding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          actions: [
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(dialogContext).pop(false),
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
                    onPressed: () => Navigator.of(dialogContext).pop(true),
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
        );
      },
    );

    if (confirmed != true) return;

    try {
      await ApiService.deleteProject(token: widget.token, id: project.id);
      if (!mounted) return;
      await _fetch();
      AppDataRefreshBus.notifyChanged();
      if (!mounted) return;
      showAppSnackBar(context, 'Proyecto eliminado');
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    }
  }

  Widget _buildCreateCallToAction() {
    if (!_isAdmin) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: _buildAdminCreateBanner(),
    );
  }

  Widget _buildProjectListHeader() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'PROYECTOS',
              style: TextStyle(
                color: AppColors.ink300,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.8,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: AppColors.ink900.withValues(alpha: 0.08),
              ),
            ),
            child: Text(
              '${_projects.length}',
              style: const TextStyle(
                color: AppColors.ink900,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProjectCard(ProjectModel project) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.ink900.withValues(alpha: 0.07)),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink900.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 10,
        ),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.brandBlue.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.assignment_outlined,
            color: AppColors.brandBlue,
            size: 22,
          ),
        ),
        title: Text(
          project.nombre,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color: AppColors.ink900,
          ),
        ),
        subtitle: project.descripcion.isNotEmpty
            ? Padding(
                padding: const EdgeInsets.only(top: 3),
                child: Text(
                  project.descripcion,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.ink700, fontSize: 13),
                ),
              )
            : null,
        trailing: _isAdmin
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
                  if (value == 'edit') _showEditProjectSheet(project);
                  if (value == 'delete') _showDeleteConfirm(project);
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
            : const Icon(Icons.chevron_right, color: AppColors.ink300, size: 20),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.brandBlue),
      );
    }

    if (_projects.isEmpty) {
      return RefreshIndicator(
        color: AppColors.brandBlue,
        onRefresh: _fetch,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          children: [
            _buildCreateCallToAction(),
            const SizedBox(height: 64),
            Center(
              child: Column(
                children: [
                  Icon(
                    Icons.assignment_outlined,
                    size: 56,
                    color: AppColors.brandBlue.withValues(alpha: 0.35),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Sin proyectos aún',
                    style: TextStyle(
                      color: AppColors.ink900,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _isAdmin
                        ? 'Puedes crearlos desde esta app.'
                        : 'Espera a que un administrador cree el primero.',
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
      onRefresh: _fetch,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          _buildCreateCallToAction(),
          _buildProjectListHeader(),
          ..._projects.map(
            (project) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _buildProjectCard(project),
            ),
          ),
        ],
      ),
    );
  }
}
