function ImageModal({ src, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <img src={src} alt="" style={styles.image} />
    </div>
  );
}

export default ImageModal;

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  },
  image: {
    maxWidth: "90%",
    maxHeight: "90%",
    borderRadius: 10
  }
};
