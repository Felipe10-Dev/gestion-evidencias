import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_data_refresh_bus.dart';
import '../../../core/utils/app_snackbar.dart';
import '../../../core/widgets/section_card.dart';
import '../../../core/widgets/stage_chip.dart';
import '../../../data/models/drive_reference_model.dart';
import '../../../data/models/project_model.dart';
import '../../../data/models/team_model.dart';
import '../../../data/services/api_service.dart';

class UploadEvidenceTab extends StatefulWidget {
  const UploadEvidenceTab({super.key, required this.token});

  final String token;

  @override
  State<UploadEvidenceTab> createState() => _UploadEvidenceTabState();
}

class _UploadEvidenceTabState extends State<UploadEvidenceTab>
  with WidgetsBindingObserver {
  final _newReferenceCtrl = TextEditingController();
  final _picker = ImagePicker();

  List<ProjectModel> _projects = const [];
  List<TeamModel> _teams = const [];
  List<DriveReferenceModel> _references = const [];
  String? _projectId;
  String? _teamId;
  String? _selectedReference;
  bool _creatingReference = false;
  String _etapa = 'antes';
  File? _selectedImage;
  bool _loading = true;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    AppDataRefreshBus.revision.addListener(_handleDataRefreshSignal);
    _loadData();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    AppDataRefreshBus.revision.removeListener(_handleDataRefreshSignal);
    _newReferenceCtrl.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadData(showLoader: false);
    }
  }

  void _handleDataRefreshSignal() {
    if (!mounted) return;
    _loadData(showLoader: false);
  }

  Future<void> _loadData({bool showLoader = true}) async {
    if (showLoader && mounted) {
      setState(() => _loading = true);
    }

    try {
      final previousProjectId = _projectId;
      final previousTeamId = _teamId;

      final projects = await ApiService.getProjects(widget.token);
      final teams = await ApiService.getTeams(widget.token);
      if (!mounted) return;

      final nextProjectId = _resolveProjectSelection(projects, previousProjectId);
      final nextTeams = nextProjectId == null
          ? const <TeamModel>[]
          : teams
                .where((team) => team.projectId == nextProjectId)
                .toList(growable: false);
      final nextTeamId = _resolveTeamSelection(nextTeams, previousTeamId);

      setState(() {
        _projects = projects;
        _teams = teams;
        _projectId = nextProjectId;
        _teamId = nextTeamId;
      });

      await _loadReferencesForSelectedTeam();
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    } finally {
      if (showLoader && mounted) {
        setState(() => _loading = false);
      }
    }
  }

  String? _resolveProjectSelection(
    List<ProjectModel> projects,
    String? previousProjectId,
  ) {
    if (projects.isEmpty) return null;

    final hasPreviousSelection = previousProjectId != null &&
        projects.any((project) => project.id == previousProjectId);
    if (hasPreviousSelection) {
      return previousProjectId;
    }

    return projects.first.id;
  }

  String? _resolveTeamSelection(
    List<TeamModel> teams,
    String? previousTeamId,
  ) {
    if (teams.isEmpty) return null;

    final hasPreviousSelection = previousTeamId != null &&
        teams.any((team) => team.id == previousTeamId);
    if (hasPreviousSelection) {
      return previousTeamId;
    }

    return teams.first.id;
  }

  Future<bool> _syncDataBeforeUpload() async {
    final previousTeamId = _teamId;
    await _loadData(showLoader: false);
    if (!mounted) return false;

    if (previousTeamId != null && previousTeamId != _teamId) {
      showAppSnackBar(
        context,
        'El equipo seleccionado ya no existe. Selecciona otro equipo antes de subir.',
      );
      return false;
    }

    return _teamId != null && _teamId!.isNotEmpty;
  }

  Future<void> _loadReferencesForSelectedTeam() async {
    if (_teamId == null || _teamId!.isEmpty) {
      if (!mounted) return;
      setState(() {
        _references = const [];
        _selectedReference = null;
        _creatingReference = false;
      });
      return;
    }

    try {
      final references = await ApiService.getTeamSubfolders(
        token: widget.token,
        teamId: _teamId!,
      );

      if (!mounted) return;
      setState(() {
        _references = references;
        _selectedReference = null;
        _creatingReference = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _references = const [];
        _selectedReference = null;
        _creatingReference = false;
      });
    }
  }

  List<TeamModel> _teamsBySelectedProject() {
    if (_projectId == null) return const [];
    return _teams
        .where((team) => team.projectId == _projectId)
        .toList(growable: false);
  }

  void _onProjectChanged(String? value) {
    if (value == null) return;

    final matchingTeams = _teams
        .where((team) => team.projectId == value)
        .toList(growable: false);
    setState(() {
      _projectId = value;
      _teamId = matchingTeams.isNotEmpty ? matchingTeams.first.id : null;
    });

    _loadReferencesForSelectedTeam();
  }

  Future<void> _onTeamChanged(String? value) async {
    setState(() => _teamId = value);
    await _loadReferencesForSelectedTeam();
  }

  Future<void> _pickImage() async {
    final xfile = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85,
    );
    if (xfile == null) return;
    setState(() => _selectedImage = File(xfile.path));
  }

  Future<void> _upload() async {
    final selectionIsCurrent = await _syncDataBeforeUpload();
    if (!selectionIsCurrent) {
      return;
    }

    if (_projectId == null ||
        _projectId!.isEmpty ||
        _teamId == null ||
        _teamId!.isEmpty ||
        _selectedImage == null) {
      showAppSnackBar(context, 'Selecciona proyecto, equipo, etapa y foto');
      return;
    }

    if (_creatingReference && _newReferenceCtrl.text.trim().isEmpty) {
      showAppSnackBar(context, 'Escribe el nombre de la nueva referencia');
      return;
    }

    if (!_creatingReference &&
        (_selectedReference == null || _selectedReference!.isEmpty)) {
      showAppSnackBar(
        context,
        'Selecciona o crea una referencia para subir la foto',
      );
      return;
    }

    setState(() => _uploading = true);
    try {
      await ApiService.uploadEvidence(
        token: widget.token,
        teamId: _teamId!,
        etapa: _etapa,
        referencia: _creatingReference
            ? _newReferenceCtrl.text.trim()
            : _selectedReference,
        imageFile: _selectedImage!,
      );

      if (!mounted) return;
      _newReferenceCtrl.clear();
      setState(() {
        _selectedImage = null;
      });
      await _loadReferencesForSelectedTeam();
      AppDataRefreshBus.notifyChanged();
      if (!mounted) return;
      showAppSnackBar(context, 'Evidencia subida correctamente');
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    } finally {
      if (mounted) {
        setState(() => _uploading = false);
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

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        const Text(
          'SUBIR EVIDENCIA',
          style: TextStyle(
            color: AppColors.ink300,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.8,
          ),
        ),
        const SizedBox(height: 10),
        if (_projects.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: AppColors.ink900.withValues(alpha: 0.07),
              ),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.info_outline,
                  size: 40,
                  color: AppColors.brandBlue.withValues(alpha: 0.5),
                ),
                const SizedBox(height: 10),
                const Text(
                  'No hay proyectos disponibles',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink900,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Crea un proyecto y equipo desde el panel web para continuar.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.ink700, fontSize: 13),
                ),
              ],
            ),
          )
        else ...[
          SectionCard(
            icon: Icons.tune_rounded,
            title: 'Selección',
            subtitle: 'Elige proyecto, equipo y referencia',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  key: ValueKey(_projectId ?? 'evidence-project-empty'),
                  initialValue: _projectId,
                  items: _projects
                      .map(
                        (project) => DropdownMenuItem<String>(
                          value: project.id,
                          child: Text(project.nombre),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: _onProjectChanged,
                  decoration: const InputDecoration(
                    labelText: 'Proyecto',
                    prefixIcon: Icon(Icons.assignment_outlined, size: 20),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  key: ValueKey(_teamId ?? 'evidence-team-empty'),
                  initialValue: _teamId,
                  items: _teamsBySelectedProject()
                      .map(
                        (team) => DropdownMenuItem<String>(
                          value: team.id,
                          child: Text(team.nombre),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: _onTeamChanged,
                  decoration: const InputDecoration(
                    labelText: 'Equipo',
                    prefixIcon: Icon(Icons.hvac, size: 20),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  key: ValueKey(
                    _creatingReference
                        ? 'creating-reference'
                        : (_selectedReference ?? 'reference-empty'),
                  ),
                  initialValue: _creatingReference ? null : _selectedReference,
                  items: _references
                      .map(
                        (reference) => DropdownMenuItem<String>(
                          value: reference.name,
                          child: Text(reference.name),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: _creatingReference
                      ? null
                      : (value) {
                          if (value == null) return;
                          setState(() => _selectedReference = value);
                        },
                  decoration: InputDecoration(
                    labelText: 'Referencia',
                    prefixIcon: const Icon(Icons.folder_outlined, size: 20),
                    hintText: _references.isEmpty
                        ? 'Sin referencias aún'
                        : 'Selecciona...',
                  ),
                ),
                const SizedBox(height: 10),
                if (!_creatingReference)
                  OutlinedButton.icon(
                    onPressed: () => setState(() {
                      _creatingReference = true;
                      _selectedReference = null;
                      _newReferenceCtrl.clear();
                    }),
                    icon: const Icon(
                      Icons.create_new_folder_outlined,
                      size: 18,
                    ),
                    label: const Text('Nueva referencia'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.brandBlue,
                      side: const BorderSide(
                        color: AppColors.brandBlue,
                        width: 1.2,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                if (_creatingReference) ...[
                  TextField(
                    controller: _newReferenceCtrl,
                    autofocus: true,
                    onChanged: (_) => setState(() {}),
                    decoration: const InputDecoration(
                      labelText: 'Nombre de la referencia',
                      prefixIcon: Icon(
                        Icons.create_new_folder_outlined,
                        size: 20,
                      ),
                      hintText: 'Ej: LG K40, Samsung A53...',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => setState(() {
                        _creatingReference = false;
                        _newReferenceCtrl.clear();
                      }),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.ink700,
                      ),
                      child: const Text('Cancelar'),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            icon: Icons.timeline_rounded,
            title: 'Etapa',
            subtitle: 'Momento del registro fotográfico',
            child: Row(
              children: [
                for (final stage in const [
                  ('antes', 'Antes', Icons.schedule_outlined),
                  ('durante', 'Durante', Icons.timelapse_outlined),
                  ('despues', 'Después', Icons.check_circle_outline),
                ])
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: StageChip(
                        label: stage.$2,
                        icon: stage.$3,
                        selected: _etapa == stage.$1,
                        onTap: () => setState(() => _etapa = stage.$1),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            icon: Icons.photo_camera_outlined,
            title: 'Fotografía',
            subtitle: 'Captura la evidencia',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_selectedImage == null)
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      height: 160,
                      decoration: BoxDecoration(
                        color: AppColors.brandBlue.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: AppColors.brandBlue.withValues(alpha: 0.25),
                          width: 1.5,
                        ),
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.add_a_photo_outlined,
                            size: 36,
                            color: AppColors.brandBlue,
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Toca para tomar foto',
                            style: TextStyle(
                              color: AppColors.brandBlue,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else ...[
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.file(
                          _selectedImage!,
                          height: 220,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 8,
                        right: 8,
                        child: GestureDetector(
                          onTap: _pickImage,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.55),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.refresh,
                                  color: Colors.white,
                                  size: 14,
                                ),
                                SizedBox(width: 4),
                                Text(
                                  'Cambiar',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _uploading ? null : _upload,
            icon: _uploading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.cloud_upload_outlined, size: 20),
            label: Text(
              _uploading ? 'Subiendo...' : 'Subir evidencia',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ],
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull {
    if (isEmpty) return null;
    return first;
  }
}
