import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../api.dart';
import '../theme.dart';
import 'workout.dart';

class CheckinScreen extends StatefulWidget {
  const CheckinScreen({super.key});
  @override
  State<CheckinScreen> createState() => _CheckinScreenState();
}

class _CheckinScreenState extends State<CheckinScreen> {
  bool? verified;
  bool sending = false;

  @override
  void initState() {
    super.initState();
    Api.checkinStatus().then((r) => setState(() => verified = r['verified'] == true));
  }

  String? error;

  Future<void> send() async {
    setState(() {
      sending = true;
      error = null;
    });
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        throw Exception('permission');
      }
      final pos = await Geolocator.getCurrentPosition();
      await Api.checkin(pos.latitude, pos.longitude);
      setState(() => verified = true);
    } catch (_) {
      setState(() => error = 'تعذر تحديد موقعك. تأكد من تفعيل الموقع والإذن ثم حاول مرة أخرى.');
    } finally {
      setState(() => sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (verified == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (verified == true) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.check_circle, size: 72, color: FC.green),
              const SizedBox(height: 16),
              const Text('تم تأكيد موقعك بنجاح',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: FC.navy)),
              const SizedBox(height: 8),
              const Text('يمكنك الآن متابعة تمارين اليوم', style: TextStyle(color: FC.muted)),
              const SizedBox(height: 24),
              FC.navyButton('الانتقال لمتابعة التمارين', () {
                Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const WorkoutScreen()));
              }),
            ]),
          ),
        ),
      );
    }
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const CircleAvatar(radius: 60, backgroundColor: Color(0xFFEEF2FF),
                child: Icon(Icons.location_on, size: 48, color: FC.navy)),
            const SizedBox(height: 20),
            const Text('تأكيد الموقع', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: FC.navy)),
            const SizedBox(height: 8),
            const Text('شارك موقعك حتى نتأكد أنك في صالة التمرين ونسجل حضورك اليوم',
                textAlign: TextAlign.center, style: TextStyle(color: FC.muted)),
            const SizedBox(height: 12),
            FC.chip('لم يتم تحديد الموقع بعد'),
            if (error != null) ...[
              const SizedBox(height: 12),
              Text(error!, style: const TextStyle(color: Colors.red, fontSize: 13), textAlign: TextAlign.center),
            ],
            const SizedBox(height: 24),
            FC.navyButton(sending ? 'جارٍ الإرسال...' : 'ارسل الموقع الان', sending ? null : send),
          ]),
        ),
      ),
    );
  }
}
