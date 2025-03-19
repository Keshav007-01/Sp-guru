
import 'package:flutter/material.dart';

void main() => runApp(GaneshaMantraApp());

class GaneshaMantraApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('Ganesha Mantra')),
        body: Center(child: Text('108 Counter + Mantra Player will be here')),
      ),
    );
  }
}
