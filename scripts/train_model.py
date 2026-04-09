"""
Entrena un modelo CNN con EMNIST Letters y lo exporta a TensorFlow.js.
El modelo reconoce letras A-Z manuscritas en imágenes de 28x28.
"""
import os
import numpy as np

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "model")

def load_emnist_letters():
    """Carga el dataset EMNIST Letters desde tensorflow_datasets o manualmente."""
    try:
        import tensorflow_datasets as tfds
        ds = tfds.load("emnist/letters", split=["train", "test"], as_supervised=True)
        
        train_images, train_labels = [], []
        for img, label in ds[0]:
            train_images.append(img.numpy())
            train_labels.append(label.numpy())
        
        test_images, test_labels = [], []
        for img, label in ds[1]:
            test_images.append(img.numpy())
            test_labels.append(label.numpy())
        
        return (
            np.array(train_images), np.array(train_labels),
            np.array(test_images), np.array(test_labels),
        )
    except Exception:
        pass
    
    # Fallback: usar keras datasets (MNIST como base) o descarga alternativa
    import urllib.request, gzip, struct, zipfile, io
    
    cache_dir = os.path.join(os.path.dirname(__file__), ".cache_emnist")
    os.makedirs(cache_dir, exist_ok=True)
    
    # Descargar desde el mirror de Cohen et al. (la fuente oficial alternativa)
    zip_url = "https://biometrics.nist.gov/cs_links/EMNIST/gzip.zip"
    zip_path = os.path.join(cache_dir, "gzip.zip")
    
    files = {
        "train_images": "gzip/emnist-letters-train-images-idx3-ubyte.gz",
        "train_labels": "gzip/emnist-letters-train-labels-idx1-ubyte.gz",
        "test_images": "gzip/emnist-letters-test-images-idx3-ubyte.gz",
        "test_labels": "gzip/emnist-letters-test-labels-idx1-ubyte.gz",
    }
    
    # Verificar si ya tenemos los archivos extraídos
    all_exist = all(
        os.path.exists(os.path.join(cache_dir, os.path.basename(f)))
        for f in files.values()
    )
    
    if not all_exist:
        if not os.path.exists(zip_path):
            print(f"Descargando EMNIST dataset (~550MB, puede tardar)...")
            urllib.request.urlretrieve(zip_url, zip_path)
        
        print("Extrayendo archivos...")
        with zipfile.ZipFile(zip_path, "r") as zf:
            for key, member in files.items():
                dest = os.path.join(cache_dir, os.path.basename(member))
                if not os.path.exists(dest):
                    data = zf.read(member)
                    with open(dest, "wb") as out:
                        out.write(data)
    
    def read_images(path):
        with gzip.open(path, "rb") as f:
            magic, n, rows, cols = struct.unpack(">IIII", f.read(16))
            data = np.frombuffer(f.read(), dtype=np.uint8)
            # EMNIST images need to be transposed
            return data.reshape(n, rows, cols).transpose(0, 2, 1)
    
    def read_labels(path):
        with gzip.open(path, "rb") as f:
            magic, n = struct.unpack(">II", f.read(8))
            return np.frombuffer(f.read(), dtype=np.uint8)
    
    train_images = read_images(os.path.join(cache_dir, "emnist-letters-train-images-idx3-ubyte.gz"))
    train_labels = read_labels(os.path.join(cache_dir, "emnist-letters-train-labels-idx1-ubyte.gz"))
    test_images = read_images(os.path.join(cache_dir, "emnist-letters-test-images-idx3-ubyte.gz"))
    test_labels = read_labels(os.path.join(cache_dir, "emnist-letters-test-labels-idx1-ubyte.gz"))
    
    return train_images, train_labels, test_images, test_labels


def build_model():
    """CNN ligera para clasificación de letras."""
    model = keras.Sequential([
        layers.Input(shape=(28, 28, 1)),
        layers.Conv2D(32, 3, activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2),
        layers.Conv2D(64, 3, activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2),
        layers.Conv2D(128, 3, activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.3),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(26, activation="softmax"),  # 26 letras A-Z
    ])
    return model


def main():
    print("Cargando EMNIST Letters...")
    train_images, train_labels, test_images, test_labels = load_emnist_letters()
    
    # EMNIST letters: labels van de 1-26, convertir a 0-25
    train_labels = train_labels - 1
    test_labels = test_labels - 1
    
    # Normalizar
    train_images = train_images.astype("float32") / 255.0
    test_images = test_images.astype("float32") / 255.0
    
    # Agregar canal
    if len(train_images.shape) == 3:
        train_images = train_images[..., np.newaxis]
        test_images = test_images[..., np.newaxis]
    
    print(f"Train: {train_images.shape}, Test: {test_images.shape}")
    print(f"Labels range: {train_labels.min()}-{train_labels.max()}")
    
    model = build_model()
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.summary()
    
    print("\nEntrenando...")
    model.fit(
        train_images, train_labels,
        validation_data=(test_images, test_labels),
        epochs=8,
        batch_size=128,
        verbose=1,
    )
    
    loss, acc = model.evaluate(test_images, test_labels, verbose=0)
    print(f"\nAccuracy en test: {acc:.4f}")
    
    # Guardar como Keras
    keras_path = os.path.join(os.path.dirname(__file__), "emnist_letters.keras")
    model.save(keras_path)
    print(f"Modelo guardado en {keras_path}")
    
    # Convertir a TensorFlow.js
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    try:
        import tensorflowjs as tfjs
        tfjs.converters.save_keras_model(model, OUTPUT_DIR)
        print(f"Modelo TF.js exportado en {OUTPUT_DIR}")
    except ImportError:
        print("tensorflowjs no instalado. Ejecuta: pip install tensorflowjs")
        print(f"Luego: tensorflowjs_converter --input_format keras {keras_path} {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
