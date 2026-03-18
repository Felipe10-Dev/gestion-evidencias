import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_snackbar.dart';
import '../../../data/models/project_model.dart';
import '../../../data/services/api_service.dart';

class ProjectsTab extends StatefulWidget {
  const ProjectsTab({super.key, required this.token});

  final String token;

  @override
  State<ProjectsTab> createState() => _ProjectsTabState();
}

class _ProjectsTabState extends State<ProjectsTab> {
  bool _loading = true;
  List<ProjectModel> _projects = const [];

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.getProjects(widget.token);
      if (!mounted) return;
      setState(() => _projects = data);
    } catch (error) {
      if (!mounted) return;
      showAppSnackBar(context, normalizeError(error));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
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

    if (_projects.isEmpty) {
      return RefreshIndicator(
        color: AppColors.brandBlue,
        onRefresh: _fetch,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 80),
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
                  const Text(
                    'Crea proyectos desde el panel web',
                    style: TextStyle(color: AppColors.ink700, fontSize: 13),
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
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        itemCount: _projects.length,
        separatorBuilder: (_, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final project = _projects[index];
          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.ink900.withValues(alpha: 0.07),
              ),
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
                        style: const TextStyle(
                          color: AppColors.ink700,
                          fontSize: 13,
                        ),
                      ),
                    )
                  : null,
              trailing: const Icon(
                Icons.chevron_right,
                color: AppColors.ink300,
                size: 20,
              ),
            ),
          );
        },
      ),
    );
  }
}
