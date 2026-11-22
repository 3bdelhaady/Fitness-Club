import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ctl = TextEditingController();
  List<Map<String, dynamic>> msgs = [];
  bool loading = true;
  bool sending = false;
  static const chips = ['احسب السعرات', 'اقتراح وجبة', 'ما هو تمريني اليوم؟'];

  @override
  void initState() {
    super.initState();
    Api.chatMessages().then((m) => setState(() {
          msgs = m.cast<Map<String, dynamic>>();
          loading = false;
        }));
  }

  Future<void> send([String? preset]) async {
    final body = (preset ?? ctl.text).trim();
    if (body.isEmpty || sending) return;
    setState(() {
      sending = true;
      msgs.add({'role': 'user', 'body': body});
      ctl.clear();
    });
    try {
      final reply = await Api.chatSend(body);
      setState(() => msgs.add({'role': 'bot', 'body': reply}));
    } finally {
      setState(() => sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          const CircleAvatar(radius: 22, backgroundColor: FC.navy,
              child: Icon(Icons.smart_toy, color: FC.mint, size: 24)),
          const SizedBox(width: 10),
          const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('غامبول AI', style: TextStyle(fontWeight: FontWeight.w800, color: FC.navy)),
            Text('مساعدك الشخصي للياقة البدنية', style: TextStyle(color: FC.muted, fontSize: 12)),
          ]),
        ]),
      ),
      Expanded(
        child: loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  if (msgs.isEmpty)
                    FC.card(const Text('اسأل غامبول عن السعرات، البروتين، اقتراح وجبة، أو تمرينك اليوم.',
                        style: TextStyle(color: FC.muted))),
                  ...msgs.map((m) {
                    final isUser = m['role'] == 'user';
                    return Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
                        decoration: BoxDecoration(
                          color: isUser ? FC.navy : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(m['body'],
                            style: TextStyle(color: isUser ? Colors.white : Colors.black87, fontSize: 14)),
                      ),
                    );
                  }),
                  if (sending) const Align(alignment: Alignment.centerLeft,
                      child: Padding(padding: EdgeInsets.all(8), child: Text('غامبول بيفكر...', style: TextStyle(color: FC.muted)))),
                ],
              ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Wrap(spacing: 8, children: chips.map((c) =>
            ActionChip(label: Text(c), onPressed: () => send(c))).toList()),
      ),
      Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          Expanded(child: TextField(
            controller: ctl,
            onSubmitted: (_) => send(),
            decoration: InputDecoration(
              hintText: 'اسأل غامبول عن أي شيء...',
              filled: true, fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          )),
          const SizedBox(width: 8),
          CircleAvatar(backgroundColor: FC.navy, child: IconButton(
            icon: const Icon(Icons.send, color: Colors.white, size: 18), onPressed: () => send())),
        ]),
      ),
    ]);
  }
}
