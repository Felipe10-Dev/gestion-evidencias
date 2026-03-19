class SessionUser {
  const SessionUser({required this.nombre, required this.rol});

  const SessionUser.empty() : nombre = '', rol = '';

  final String nombre;
  final String rol;

  bool get hasData => nombre.isNotEmpty || rol.isNotEmpty;

  bool get isAdmin => rol == 'admin';

  String get rolLabel {
    switch (rol) {
      case 'admin':
        return 'Administrador';
      case 'tecnico':
        return 'Técnico';
      default:
        return rol;
    }
  }
}
