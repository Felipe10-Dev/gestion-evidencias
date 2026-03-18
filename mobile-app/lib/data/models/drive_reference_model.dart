class DriveReferenceModel {
  const DriveReferenceModel({
    required this.id,
    required this.name,
    required this.driveUrl,
  });

  final String id;
  final String name;
  final String driveUrl;

  factory DriveReferenceModel.fromJson(Map<String, dynamic> json) {
    return DriveReferenceModel(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      driveUrl: (json['driveUrl'] ?? '').toString(),
    );
  }
}
