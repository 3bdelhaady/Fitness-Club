import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fitness_club/main.dart';

void main() {
  testWidgets('app boots to splash then login when logged out', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const FitnessApp());
    expect(find.text('مرحبا بك في نادي اللياقة البدنية'), findsWidgets);
    await tester.pumpAndSettle();
    expect(find.text('تسجيل الدخول'), findsOneWidget);
    expect(find.text('الدخول بحساب مركز الطلاب'), findsOneWidget);
  });
}
