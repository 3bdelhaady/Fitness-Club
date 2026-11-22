import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import 'checkin.dart';
import 'workout.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<Map<String, dynamic>> future = Api.bootstrap();

  Future<void> reload() async => setState(() => future = Api.bootstrap());

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: future,
      builder: (context, snap) {
        if (!snap.hasData) return const Center(child: CircularProgressIndicator());
        final data = snap.data!;
        final user = data['user'];
        final profile = data['profile'] ?? {};
        final home = data['home'];
        final today = DateTime.now();
        final weekStart = today.subtract(Duration(days: today.weekday % 7));
        return RefreshIndicator(
          onRefresh: reload,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('أهلاً بك يا ${(user['name'] as String).split(' ').first}',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: FC.navy)),
                  Row(children: [
                    const Icon(Icons.location_on, size: 14, color: FC.muted),
                    Text(profile['gym_name'] ?? 'لم تختر صالتك بعد',
                        style: const TextStyle(color: FC.muted, fontSize: 13)),
                  ]),
                ]),
                FC.chip('سلسلة ${profile['streak'] ?? 0} يوم', icon: Icons.local_fire_department),
              ]),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(7, (i) {
                  final d = weekStart.add(Duration(days: i));
                  final isToday = d.day == today.day && d.month == today.month;
                  return Column(children: [
                    Text('${d.day}', style: const TextStyle(fontSize: 12, color: FC.muted)),
                    const SizedBox(height: 4),
                    CircleAvatar(radius: 4, backgroundColor: isToday ? Colors.red : const Color(0xFFD1D5DB)),
                  ]);
                }),
              ),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(child: FC.card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('حجم الرفع', style: TextStyle(color: FC.muted, fontSize: 13)),
                  Text('${home['volume']} KG', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: FC.navy)),
                  const Text('آخر ٧ أيام', style: TextStyle(color: FC.muted, fontSize: 12)),
                ]))),
                const SizedBox(width: 12),
                Expanded(child: FC.card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('الهدف', style: TextStyle(color: FC.muted, fontSize: 13)),
                  Text('${home['goalPct']}%', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: FC.navy)),
                  LinearProgressIndicator(value: home['goalPct'] / 100, color: FC.green, backgroundColor: const Color(0xFFE5E7EB)),
                ]))),
              ]),
              FC.card(Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('السعرات المحروقة اليوم', style: TextStyle(color: FC.muted, fontSize: 13)),
                  Text('${home['kcalToday']} سعرة', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: FC.navy)),
                  Text('الهدف اليومي ${home['kcalGoal']} سعرة', style: const TextStyle(color: FC.muted, fontSize: 12)),
                ]),
                SizedBox(
                  width: 64, height: 64,
                  child: CircularProgressIndicator(
                    value: (home['kcalToday'] / (home['kcalGoal'] as num)).clamp(0.0, 1.0),
                    strokeWidth: 8, color: FC.mint, backgroundColor: const Color(0xFFE5E7EB),
                  ),
                ),
              ])),
              const SizedBox(height: 4),
              FC.navyButton('ابد الان', () async {
                final checkedIn = home['checkedIn'] == true;
                await Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => checkedIn ? const WorkoutScreen() : const CheckinScreen()));
                reload();
              }),
            ],
          ),
        );
      },
    );
  }
}
