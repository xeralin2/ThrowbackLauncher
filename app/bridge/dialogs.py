from PySide6.QtWidgets import QFileDialog


def pick_file(title: str, name_filter: str) -> str:
    picked, _ = QFileDialog.getOpenFileName(None, title, "", name_filter)
    return picked
