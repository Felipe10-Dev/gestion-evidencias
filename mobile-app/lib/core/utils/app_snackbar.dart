import 'package:flutter/material.dart';

void showAppSnackBar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}

String normalizeError(Object error) {
  return error.toString().replaceFirst('Exception: ', '');
}
