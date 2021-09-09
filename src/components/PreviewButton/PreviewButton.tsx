import Link from "next/link";

import styles from "./previewButton.module.scss";

export default function PreviewButton() {
  return (
    <aside className={styles.buttonPreview}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </aside>
  );
}
