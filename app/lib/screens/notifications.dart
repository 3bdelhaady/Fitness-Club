import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<List<dynamic>> future =
      Api.notifications().then((r) => r['notifications'] as List);

  @override
  void initState() {
    super.initState();
    Api.markNotificationsRead();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإشعارات', style: TextStyle(color: FC.navy, fontWeight: FontWeight.w800))),
      body: FutureBuilder<List<dynamic>>(
        future: future,
        builder: (context, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final items = snap.data!.cast<Map<String, dynamic>>();
          if (items.isEmpty) {
            return const Center(child: Text('لا توجد إشعارات بعد', style: TextStyle(color: FC.muted)));
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: items.map((n) => FC.card(Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Icon(Icons.notifications, color: FC.navy),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(n['title'], style: const TextStyle(fontWeight: FontWeight.w800)),
                    if ((n['body'] ?? '') != '')
                      Text(n['body'], style: const TextStyle(color: FC.muted, fontSize: 13)),
                  ])),
                  if (n['read'] != true)
                    const CircleAvatar(radius: 4, backgroundColor: FC.green),
                ]))).toList(),
          );
        },
      ),
    );
  }
}
