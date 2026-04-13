"""
Entrena un modelo CNN con EMNIST Digits (0-9) y exporta pesos para TF.js.
Misma arquitectura que el modelo de letras, pero con 10 clases.
"""
import os
import json
import numpy as np

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "model-digits")


def load_emnist_digits():
    """Carga EMNIST Digits. Fallback a MNIST si no disponible."""
    # Intentar MNIST primero (más rápido, mismo formato)
    print("Cargando MNIST digits...")
    (train_images, train_labels), (test_images, test_labels) = keras.datasets.mnist.load_data()
    return train_images, train_labels, test_images, test_labels


def build_model():
    """CNN para clasificación de dígitos 0-9."""
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
        layers.Dense(10, activation="softmax"),  # 10 dígitos 0-9
    ])
    return model


def export_weights_tfjs_order(model, output_dir):
    """Exporta pesos en orden TF.js (trainable primero, luego non-trainable)."""
    weights = model.get_weights()
    names = [w.name for w in model.weights]

    trainable_indices = []
    non_trainable_indices = []
    for i, n in enumerate(names):
        if "moving_mean" in n or "moving_variance" in n:
            non_trainable_indices.append(i)
        else:
            trainable_indices.append(i)

    tfjs_order = trainable_indices + non_trainable_indices

    reordered_specs = []
    weights_data = b""
    for idx in tfjs_order:
        w = weights[idx]
        reordered_specs.append({
            "name": names[idx],
            "shape": list(w.shape),
            "dtype": "float32",
        })
        weights_data += w.astype(np.float32).flatten().tobytes()

    os.makedirs(output_dir, exist_ok=True)

    with open(os.path.join(output_dir, "group1-shard1of1.bin"), "wb") as f:
        f.write(weights_data)

    with open(os.path.join(output_dir, "weights_spec.json"), "w") as f:
        json.dump(reordered_specs, f, indent=2)

    print(f"Exportado: {len(weights_data)} bytes, {len(reordered_specs)} tensores")


def main():
    train_images, train_labels, test_images, test_labels = load_emnist_digits()

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

    # Guardar modelo Keras
    keras_path = os.path.join(os.path.dirname(__file__), "emnist_digits.keras")
    model.save(keras_path)
    print(f"Modelo guardado en {keras_path}")

    # Exportar pesos en orden TF.js
    export_weights_tfjs_order(model, OUTPUT_DIR)
    print(f"Pesos TF.js exportados en {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
