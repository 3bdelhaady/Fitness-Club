import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';

class ScheduleScreen extends StatefulWidget {
  final List<String> current;
  const ScheduleScreen({super.key, required this.current});
  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  static const days = [
    ['sat', 'السبت'], ['sun', 'الأحد'], ['mon', 'الاثنين'],
    ['tue', 'الثلاثاء'], ['wed', 'الأربعاء'], ['thu', 'الخميس'], ['fri', 'الجمعة'],
  ];
  late final Set<String> selected = Set.of(widget.current);
  bool saving = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('جدول التمرين', style: TextStyle(color: FC.navy, fontWeight: FontWeight.w800))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        FC.card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          GridView.count(
            crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 3.4, crossAxisSpacing: 10, mainAxisSpacing: 10,
            children: days.map((d) {
              final on = selected.contains(d[0]);
              return GestureDetector(
                onTap: () => setState(() => on ? selected.remove(d[0]) : selected.add(d[0])),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: on ? const Color(0xFFEEF2FF) : Colors.white,
                    border: Border.all(color: on ? FC.navy : const Color(0xFFE5E7EB), width: 1.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(children: [
                    Icon(on ? Icons.check_box : Icons.check_box_outline_blank,
                        size: 20, color: on ? FC.navy : FC.muted),
                    const SizedBox(width: 8),
                    Text(d[1]),
                  ]),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 14),
          FC.notice('سيتم معالجة التعديلات بداية من الأسبوع القادم'),
        ])),
        FC.navyButton(saving ? 'جارٍ الحفظ...' : 'حفظ', saving ? null : () async {
          setState(() => saving = true);
          await Api.updateMe(schedule: selected.toList());
          if (context.mounted) Navigator.of(context).pop();
        }, color: FC.green),
      ]),
    );
  }
}
