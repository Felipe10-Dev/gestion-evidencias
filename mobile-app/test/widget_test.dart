import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile_app/app/app.dart';

void main() {
  testWidgets('renders login screen when there is no active session', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const EvidenceApp());
    await tester.pumpAndSettle();

    expect(find.text('Gestión de Evidencias'), findsOneWidget);
    expect(find.text('Inicia sesión'), findsOneWidget);
  });
}
