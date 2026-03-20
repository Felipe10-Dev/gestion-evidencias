import 'package:flutter/foundation.dart';

abstract final class AppDataRefreshBus {
  static final ValueNotifier<int> revision = ValueNotifier<int>(0);

  static void notifyChanged() {
    revision.value = revision.value + 1;
  }
}