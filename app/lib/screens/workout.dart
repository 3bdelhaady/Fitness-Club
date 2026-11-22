import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import 'routines.dart';

class WorkoutScreen extends StatefulWidget {
  const WorkoutScreen({super.key});
  @override
  State<WorkoutScreen> createState() => _WorkoutScreenState();
}

class _WorkoutScreenState extends State<WorkoutScreen> {
  late Future<Map<String, dynamic>> future = Api.workoutToday();
  static const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

  Future<void> reload() async => setState(() => future = Api.workoutToday());

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: future,
      builder: (context, snap) {
        if (!snap.hasData) return const Center(child: CircularProgressIndicator());
        final exs = (snap.data!['exercises'] as List).cast<Map<String, dynamic>>();
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('تمارين اليوم', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: FC.navy)),
              TextButton(
                onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const RoutinesScreen())),
                child: const Text('تعديل الروتين', style: TextStyle(color: FC.navy, fontWeight: FontWeight.w700)),
              ),
            ]),
            ...exs.map((ex) {
              final sets = (ex['sets'] as List).cast<Map<String, dynamic>>();
              final done = sets.where((s) => s['done'] == true).length;
              return FC.card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(ex['name_ar'], style: const TextStyle(fontWeight: FontWeight.w800, color: FC.navy, fontSize: 16)),
                    Text(ex['name_en'], style: const TextStyle(color: FC.muted, fontSize: 12)),
                  ]),
                  FC.chip('تم إكمال $done من ${sets.length} مجموعات'),
                ]),
                const SizedBox(height: 10),
                ...sets.map((s) => SetRow(
                      key: ValueKey(s['set_id']),
                      setData: s,
                      label: '${ordinals[(s['set_index'] as int) - 1]} Set',
                      onSaved: reload,
                    )),
              ]));
            }),
            FC.card(Row(children: [
              const Icon(Icons.timer_outlined, color: FC.navy),
              const SizedBox(width: 8),
              const Text('Muscle Rest Time', style: TextStyle(fontWeight: FontWeight.w700)),
              const Spacer(),
              Text('${exs.isNotEmpty ? exs.first['rest_min'] : 5} دقائق', style: const TextStyle(color: FC.muted)),
            ])),
          ],
        );
      },
    );
  }
}

class SetRow extends StatefulWidget {
  final Map<String, dynamic> setData;
  final String label;
  final Future<void> Function() onSaved;
  const SetRow({super.key, required this.setData, required this.label, required this.onSaved});
  @override
  State<SetRow> createState() => _SetRowState();
}

class _SetRowState extends State<SetRow> {
  late final repsCtl = TextEditingController(text: '${widget.setData['reps']}');
  late final weightCtl = TextEditingController(text: '${widget.setData['weight']}');
  late bool done = widget.setData['done'] == true;

  Future<void> save({bool? markDone}) async {
    await Api.saveSet(
      widget.setData['set_id'] as int,
      reps: int.tryParse(repsCtl.text),
      weight: double.tryParse(weightCtl.text),
      done: markDone ?? done,
    );
    await widget.onSaved();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: done ? FC.mintSoft : Colors.white,
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(children: [
        InkWell(
          onTap: () async {
            setState(() => done = !done);
            await save(markDone: done);
          },
          child: Container(
            width: 22, height: 22,
            decoration: BoxDecoration(
              color: done ? FC.green : Colors.white,
              border: Border.all(color: const Color(0xFF9CA3AF), width: 1.5),
              borderRadius: BorderRadius.circular(6),
            ),
            child: done ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
          ),
        ),
        const SizedBox(width: 8),
        Text(widget.label, style: const TextStyle(fontWeight: FontWeight.w600)),
        const Spacer(),
        if (!done) ...[
          SizedBox(width: 52, height: 34, child: TextField(
            controller: repsCtl, keyboardType: TextInputType.number, textAlign: TextAlign.center,
            decoration: const InputDecoration(hintText: 'عدات', contentPadding: EdgeInsets.zero, border: OutlineInputBorder()),
            onSubmitted: (_) => save(markDone: true),
          )),
          const SizedBox(width: 6),
          SizedBox(width: 60, height: 34, child: TextField(
            controller: weightCtl, keyboardType: TextInputType.number, textAlign: TextAlign.center,
            decoration: const InputDecoration(hintText: 'kg', contentPadding: EdgeInsets.zero, border: OutlineInputBorder()),
            onSubmitted: (_) => save(markDone: true),
          )),
        ] else
          Text('× ${widget.setData['reps']} Reps · ${widget.setData['weight']}kg',
              style: const TextStyle(color: FC.muted, fontSize: 12)),
      ]),
    );
  }
}
