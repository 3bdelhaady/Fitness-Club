import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../main.dart';
import 'gyms.dart';
import 'schedule.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<Map<String, dynamic>> future = Api.bootstrap();
  static const goals = {'bulk': 'تضخيم', 'cut': 'خسارة الوزن', 'shred': 'التنشيف'};
  static const dayLabels = {'sat': 'السبت', 'sun': 'الأحد', 'mon': 'الاثنين', 'tue': 'الثلاثاء', 'wed': 'الأربعاء', 'thu': 'الخميس', 'fri': 'الجمعة'};

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: future,
      builder: (context, snap) {
        if (!snap.hasData) return const Center(child: CircularProgressIndicator());
        final user = snap.data!['user'];
        final p = snap.data!['profile'] ?? {};
        final schedule = ((p['schedule'] as List?) ?? []).cast<String>();
        return ListView(padding: const EdgeInsets.all(16), children: [
          FC.card(Column(children: [
            CircleAvatar(radius: 36, backgroundColor: FC.navy,
                child: Text((user['name'] as String).characters.first,
                    style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800))),
            const SizedBox(height: 10),
            Text(user['name'], style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('المعرف ${user['hub_user_id']}', style: const TextStyle(color: FC.muted, fontSize: 12)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, children: [
              if ((p['university'] ?? '') != '') FC.chip(p['university']),
              if ((p['faculty'] ?? '') != '') FC.chip(p['faculty']),
            ]),
          ])),
          FC.card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('هدفك', style: TextStyle(fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            Wrap(spacing: 8, children: goals.entries.map((g) {
              final active = p['goal'] == g.key;
              return GestureDetector(
                onTap: () async {
                  await Api.updateMe(goal: g.key);
                  setState(() => future = Api.bootstrap());
                },
                child: FC.chip(g.value, bg: active ? FC.navy : const Color(0xFFEEF2FF), fg: active ? Colors.white : FC.navy),
              );
            }).toList()),
          ])),
          FC.card(Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('صالة التمرين الخاصة بي', style: TextStyle(fontWeight: FontWeight.w800)),
              Row(children: [
                const Icon(Icons.location_on, size: 14, color: FC.muted),
                Text(p['gym_name'] ?? 'لم تختر صالة بعد', style: const TextStyle(color: FC.muted, fontSize: 13)),
              ]),
            ]),
            GestureDetector(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const GymsScreen())),
              child: FC.chip('البحث عن جيم'),
            ),
          ])),
          FC.card(Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('جدول التمرين الخاص بي', style: TextStyle(fontWeight: FontWeight.w800)),
              Text(schedule.map((d) => dayLabels[d] ?? d).join('، '),
                  style: const TextStyle(color: FC.muted, fontSize: 13)),
            ]),
            GestureDetector(
              onTap: () async {
                await Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => ScheduleScreen(current: schedule)));
                setState(() => future = Api.bootstrap());
              },
              child: FC.chip('تعديل', icon: Icons.edit),
            ),
          ])),
          FC.card(const Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('اللغة', style: TextStyle(fontWeight: FontWeight.w800)),
            Text('العربية (AR)', style: TextStyle(color: FC.muted)),
          ])),
          FC.card(const Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('المظهر', style: TextStyle(fontWeight: FontWeight.w800)),
            Text('فاتح', style: TextStyle(color: FC.muted)),
          ])),
          const SizedBox(height: 4),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () async {
                await Api.logout();
                if (context.mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const FitnessApp()), (_) => false);
                }
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: FC.navy, width: 1.5),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('تسجيل الخروج', style: TextStyle(color: FC.navy, fontWeight: FontWeight.w700)),
            ),
          ),
        ]);
      },
    );
  }
}
