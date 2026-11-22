import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';

class RoutinesScreen extends StatefulWidget {
  const RoutinesScreen({super.key});
  @override
  State<RoutinesScreen> createState() => _RoutinesScreenState();
}

class _RoutinesScreenState extends State<RoutinesScreen> {
  late Future<Map<String, dynamic>> future = Api.routines();

  Future<void> choose(Map<String, dynamic> level) async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تأكيد الروتين', textAlign: TextAlign.center),
        content: Text('سيتم تعيين روتين ${level['title_ar']} (تضخيم) كروتين اساس لك. هل أنت متأكد؟',
            textAlign: TextAlign.center),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          SizedBox(width: 110, child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: FC.navy, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true), child: const Text('نعم'))),
          SizedBox(width: 110, child: OutlinedButton(
            onPressed: () => Navigator.pop(ctx, false), child: const Text('لا'))),
        ],
      ),
    );
    if (yes == true) {
      await Api.setLevel(level['level']);
      setState(() => future = Api.routines());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('تعديل الروتين', style: TextStyle(color: FC.navy, fontWeight: FontWeight.w800))),
      body: FutureBuilder<Map<String, dynamic>>(
        future: future,
        builder: (context, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final levels = (snap.data!['levels'] as List).cast<Map<String, dynamic>>();
          final current = snap.data!['current'];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ...List.generate(levels.length, (i) {
                final l = levels[i];
                final selected = l['level'] == current;
                return GestureDetector(
                  onTap: () => choose(l),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: FC.pastels[i % FC.pastels.length],
                      borderRadius: BorderRadius.circular(18),
                      border: selected ? Border.all(color: FC.navy, width: 2) : null,
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Row(children: [
                          const Icon(Icons.eco, color: FC.navy, size: 20),
                          const SizedBox(width: 8),
                          Text(l['title_ar'], style: const TextStyle(fontWeight: FontWeight.w800)),
                        ]),
                        Text('${l['pct']}%', style: const TextStyle(fontWeight: FontWeight.w800, color: FC.navy)),
                      ]),
                      const Text('Muscle Gain', style: TextStyle(color: FC.muted, fontSize: 12)),
                    ]),
                  ),
                );
              }),
              FC.card(
                Column(children: [
                  const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.add, color: FC.mint),
                    SizedBox(width: 6),
                    Text('إنشاء روتين مخصص', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                  ]),
                  const SizedBox(height: 4),
                  const Text('صمم مسار تدريبك خاص بك', style: TextStyle(color: Colors.white70, fontSize: 13)),
                ]),
                color: FC.navy,
              ),
              FC.notice('سوف يتم إضافة تخصيص روتين تدريبي قريبا جدا'),
              const SizedBox(height: 12),
              FC.navyButton('العودة لصفحة التمارين', () => Navigator.of(context).pop(), color: FC.green),
            ],
          );
        },
      ),
    );
  }
}
