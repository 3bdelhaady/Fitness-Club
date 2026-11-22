import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';

class GymsScreen extends StatelessWidget {
  const GymsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الجيمات القريبة منك', style: TextStyle(color: FC.navy, fontWeight: FontWeight.w800))),
      body: FutureBuilder<List<dynamic>>(
        future: Api.gyms(),
        builder: (context, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final gyms = snap.data!.cast<Map<String, dynamic>>();
          return ListView(padding: const EdgeInsets.all(16), children: [
            Container(
              height: 140, margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(color: const Color(0xFFE8EEF7), borderRadius: BorderRadius.circular(18)),
              child: Center(child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.location_on, size: 16, color: FC.muted),
                Text('خريطة المواقع — موقعك و ${gyms.length} جيمات قريبة', style: const TextStyle(color: FC.muted)),
              ])),
            ),
            ...gyms.map((g) => GestureDetector(
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => GymDetailScreen(gymId: g['id']))),
                  child: FC.card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text(g['name'], style: const TextStyle(fontWeight: FontWeight.w800, color: FC.navy, fontSize: 16)),
                      FC.chip('${g['rating_pct']}%'),
                    ]),
                    Text('${g['area']} · ${g['focus']}', style: const TextStyle(color: FC.muted, fontSize: 13)),
                    Text('${g['members']} عضو · التقييمات الايجابية', style: const TextStyle(color: FC.muted, fontSize: 12)),
                    const SizedBox(height: 6),
                    LinearProgressIndicator(value: g['rating_pct'] / 100, color: FC.green, backgroundColor: const Color(0xFFE5E7EB)),
                  ])),
                )),
          ]);
        },
      ),
    );
  }
}

class GymDetailScreen extends StatefulWidget {
  final int gymId;
  const GymDetailScreen({super.key, required this.gymId});
  @override
  State<GymDetailScreen> createState() => _GymDetailScreenState();
}

class _GymDetailScreenState extends State<GymDetailScreen> {
  int? selectedPlan;
  bool saving = false;
  bool doneFlag = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('تفاصيل الجيم', style: TextStyle(color: FC.navy, fontWeight: FontWeight.w800))),
      body: FutureBuilder<Map<String, dynamic>>(
        future: Api.gym(widget.gymId),
        builder: (context, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final gym = snap.data!['gym'];
          final plans = (snap.data!['plans'] as List).cast<Map<String, dynamic>>();
          selectedPlan ??= plans.length > 1 ? plans[1]['id'] : plans.first['id'];
          return ListView(padding: const EdgeInsets.all(16), children: [
            FC.card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(gym['name'], style: const TextStyle(fontWeight: FontWeight.w800, color: FC.navy, fontSize: 18)),
                  Text('${gym['area']} · ${gym['focus']}', style: const TextStyle(color: FC.muted, fontSize: 13)),
                ]),
                FC.chip('الأنسب لك +'),
              ]),
              const SizedBox(height: 6),
              Text('التقييمات الايجابية ${gym['rating_pct']}%', style: const TextStyle(color: FC.muted, fontSize: 12)),
              LinearProgressIndicator(value: gym['rating_pct'] / 100, color: FC.green, backgroundColor: const Color(0xFFE5E7EB)),
            ])),
            FC.card(const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('الأصدقاء في هذا الجيم', style: TextStyle(fontWeight: FontWeight.w800)),
              SizedBox(height: 6),
              Text('لا يوجد أصدقاء مسجلون بعد — كن أولهم 🔥', style: TextStyle(color: FC.muted, fontSize: 13)),
            ])),
            const Text('خطط الاشتراك', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 10),
            ...plans.map((p) {
              final sel = selectedPlan == p['id'];
              return GestureDetector(
                onTap: () => setState(() => selectedPlan = p['id']),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: sel ? FC.navy : const Color(0xFFE5E7EB), width: sel ? 2 : 1),
                  ),
                  child: Row(children: [
                    Icon(sel ? Icons.radio_button_checked : Icons.radio_button_off, color: FC.navy),
                    const SizedBox(width: 10),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('${p['price_egp']} جنيه',
                          style: const TextStyle(fontWeight: FontWeight.w800, color: FC.navy, fontSize: 16)),
                      Text(p['title'], style: const TextStyle(color: FC.muted, fontSize: 13)),
                      Text(p['period'], style: const TextStyle(color: FC.muted, fontSize: 12)),
                    ]),
                  ]),
                ),
              );
            }),
            const SizedBox(height: 6),
            if (doneFlag) FC.notice('تم تسجيل طلب الاشتراك — المراجعة تتم يدويًا من إدارة الجيم.'),
            const SizedBox(height: 6),
            FC.navyButton(saving ? 'جارٍ الحفظ...' : 'اختر خطة اشتراك', saving ? null : () async {
              setState(() => saving = true);
              await Api.subscribe(widget.gymId, selectedPlan!);
              setState(() {
                saving = false;
                doneFlag = true;
              });
            }),
          ]);
        },
      ),
    );
  }
}
