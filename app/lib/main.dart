import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'api.dart';
import 'theme.dart';
import 'screens/shell.dart';

void main() => runApp(const FitnessApp());

class FitnessApp extends StatelessWidget {
  const FitnessApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fitness Club',
      debugShowCheckedModeBanner: false,
      theme: FC.theme(),
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const Gate(),
    );
  }
}

class Gate extends StatefulWidget {
  const Gate({super.key});
  @override
  State<Gate> createState() => _GateState();
}

class _GateState extends State<Gate> {
  bool? loggedIn;
  @override
  void initState() {
    super.initState();
    Api.loadToken().then((t) async {
      if (t == null) {
        setState(() => loggedIn = false);
        return;
      }
      try {
        await Api.bootstrap();
        setState(() => loggedIn = true);
      } catch (_) {
        await Api.logout();
        setState(() => loggedIn = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (loggedIn == null) return const SplashScreen();
    if (loggedIn == false) {
      return LoginScreen(onLoggedIn: () => setState(() => loggedIn = true));
    }
    return const Shell();
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFF0E1A3F), FC.navy, FC.navy2],
        ),
      ),
      child: const Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          CircleAvatar(
            radius: 60,
            backgroundColor: Color(0x1FFFFFFF),
            child: Icon(Icons.fitness_center, size: 56, color: FC.mint),
          ),
          SizedBox(height: 24),
          Text('مرحبا بك في نادي اللياقة البدنية',
              style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
          SizedBox(height: 6),
          Text('تتبع التمارين', style: TextStyle(color: Colors.white70, fontSize: 15)),
          SizedBox(height: 4),
          Text('أحد منتجات مركز الطلاب', style: TextStyle(color: Colors.white54, fontSize: 13)),
        ]),
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoggedIn;
  const LoginScreen({super.key, required this.onLoggedIn});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool busy = false;
  String? error;

  String _newState() {
    final r = Random.secure();
    return List.generate(32, (_) => r.nextInt(16).toRadixString(16)).join();
  }

  Future<void> _startHubLogin() async {
    setState(() {
      busy = true;
      error = null;
    });
    final state = _newState();
    final done = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => HubConnectWebView(state: state)),
    );
    if (!mounted) return;
    setState(() => busy = false);
    if (done == true) {
      widget.onLoggedIn();
    } else {
      setState(() => error = 'لم يكتمل تسجيل الدخول. حاول مرة أخرى.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFF0E1A3F), FC.navy, FC.navy2],
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const CircleAvatar(
                radius: 60,
                backgroundColor: Color(0x1FFFFFFF),
                child: Icon(Icons.fitness_center, size: 56, color: FC.mint),
              ),
              const SizedBox(height: 20),
              const Text('تسجيل الدخول',
                  style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              const Text('التطبيق مخصص لأعضاء مركز الطلاب فقط. سجّل الدخول بحسابك في مركز الطلاب للمتابعة.',
                  textAlign: TextAlign.center, style: TextStyle(color: Colors.white70, fontSize: 14)),
              const SizedBox(height: 12),
              FC.notice('لا يوجد تسجيل مباشر — تحتاج حساب مركز الطلاب أولاً.'),
              if (error != null) ...[
                const SizedBox(height: 12),
                Text(error!, style: const TextStyle(color: Color(0xFFFCA5A5))),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: busy ? null : _startHubLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: FC.navy,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(busy ? 'جارٍ الفتح...' : 'الدخول بحساب مركز الطلاب',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

/// In-app WebView for the Hub connect flow. Intercepts the allowlisted
/// backend callback URL and extracts code+state without loading it.
class HubConnectWebView extends StatefulWidget {
  final String state;
  const HubConnectWebView({super.key, required this.state});
  @override
  State<HubConnectWebView> createState() => _HubConnectWebViewState();
}

class _HubConnectWebViewState extends State<HubConnectWebView> {
  late final WebViewController controller;
  bool exchanging = false;

  @override
  void initState() {
    super.initState();
    final callbackPrefix = '${Api.base}/api/auth/hub/callback';
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          if (req.url.startsWith(callbackPrefix)) {
            final uri = Uri.parse(req.url);
            _exchange(uri.queryParameters['code'] ?? '', uri.queryParameters['state'] ?? '');
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadRequest(Uri.parse('${Api.hubUrl}/fitness/connect?state=${widget.state}'));
  }

  Future<void> _exchange(String code, String state) async {
    if (exchanging) return;
    exchanging = true;
    try {
      if (state != widget.state || code.isEmpty) throw Exception('state mismatch');
      await Api.exchange(code, state);
      if (mounted) Navigator.of(context).pop(true);
    } catch (_) {
      if (mounted) Navigator.of(context).pop(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('مركز الطلاب — ربط الحساب'), backgroundColor: Colors.white),
      body: WebViewWidget(controller: controller),
    );
  }
}
