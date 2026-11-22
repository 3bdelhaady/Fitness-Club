import 'package:flutter/material.dart';
import '../theme.dart';
import 'home.dart';
import 'workout.dart';
import 'chat.dart';
import 'profile.dart';

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int tab = 0;
  final pages = const [HomeScreen(), WorkoutScreen(), ChatScreen(), ProfileScreen()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fitness Club',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: FC.navy)),
        actions: const [
          Icon(Icons.notifications_outlined, color: FC.navy),
          SizedBox(width: 12),
          CircleAvatar(radius: 17, backgroundColor: FC.navy,
              child: Icon(Icons.person, size: 18, color: Colors.white)),
          SizedBox(width: 16),
        ],
      ),
      body: pages[tab],
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (i) => setState(() => tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'الرئيسية'),
          NavigationDestination(icon: Icon(Icons.fitness_center), label: 'التمارين'),
          NavigationDestination(icon: Icon(Icons.smart_toy_outlined), label: 'غامبول AI'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'الملف الشخصي'),
        ],
      ),
    );
  }
}
