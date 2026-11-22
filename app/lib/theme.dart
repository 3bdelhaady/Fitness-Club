import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FC {
  static const navy = Color(0xFF16265C);
  static const navy2 = Color(0xFF1E3A8A);
  static const bg = Color(0xFFF4F6FA);
  static const mint = Color(0xFF5EEAD4);
  static const mintSoft = Color(0xFFD9F7EE);
  static const green = Color(0xFF22C55E);
  static const muted = Color(0xFF6B7280);
  static const yellowBg = Color(0xFFFEF9C3);
  static const yellowText = Color(0xFF854D0E);
  static const pastels = [
    Color(0xFFD9F7EE), Color(0xFFE0F2FE), Color(0xFFFFF7ED),
    Color(0xFFFEF2F2), Color(0xFFFAF5FF), Color(0xFFECFCCB),
  ];

  static ThemeData theme() {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: bg,
      textTheme: GoogleFonts.cairoTextTheme(base.textTheme),
      colorScheme: ColorScheme.fromSeed(seedColor: navy, primary: navy),
      appBarTheme: const AppBarTheme(backgroundColor: bg, elevation: 0, centerTitle: false),
    );
  }

  static Widget card(Widget child, {EdgeInsets? padding, Color? color}) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 12),
        padding: padding ?? const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color ?? Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [BoxShadow(color: navy.withValues(alpha: 0.06), blurRadius: 3, offset: const Offset(0, 1))],
        ),
        child: child,
      );

  static Widget navyButton(String label, VoidCallback? onTap, {Color? color}) => SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(
            backgroundColor: color ?? navy,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          ),
          child: Text(label),
        ),
      );

  static Widget chip(String label, {Color? bg, Color? fg, IconData? icon}) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(color: bg ?? const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(99)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 14, color: fg ?? navy), const SizedBox(width: 4)],
          Text(label, style: TextStyle(color: fg ?? navy, fontSize: 13, fontWeight: FontWeight.w600)),
        ]),
      );

  static Widget notice(String text) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: yellowBg,
          border: Border.all(color: const Color(0xFFFDE68A)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(text, style: const TextStyle(color: yellowText, fontSize: 13)),
      );
}
