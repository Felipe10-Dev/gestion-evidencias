class TeamModel {
  const TeamModel({
    required this.id,
    required this.nombre,
    required this.projectId,
  });

  final String id;
  final String nombre;
  final String projectId;

  factory TeamModel.fromJson(Map<String, dynamic> json) {
    return TeamModel(
      id: (json['id'] ?? '').toString(),
      nombre: (json['nombre'] ?? '').toString(),
      projectId: (json['ProjectId'] ?? '').toString(),
    );
  }
}
