"""Planetary rover route planner for user-mapped craters and bumps."""

import argparse
import math
from dataclasses import dataclass, field
from heapq import heappop, heappush
from pathlib import Path

import matplotlib.pyplot as plt

HAZARD_RISK = {"crater": 80, "bump": 25}


@dataclass(frozen=True)
class Position:
    x: int
    y: int

    def __str__(self) -> str:
        return f"({self.x}, {self.y})"


@dataclass(frozen=True)
class Hazard:
    kind: str
    position: Position
    risk: int

    def __post_init__(self) -> None:
        if self.kind not in HAZARD_RISK:
            raise ValueError(f"Unknown hazard type: {self.kind}")
        if self.risk < 0:
            raise ValueError("Hazard risk cannot be negative.")


@dataclass
class PlanetMap:
    width: int
    height: int
    start: Position
    destination: Position
    hazards: dict[tuple[int, int], Hazard] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.width <= 0 or self.height <= 0:
            raise ValueError("Map width and height must be positive.")
        self.validate_position(self.start, "Start")
        self.validate_position(self.destination, "Destination")

        for key, hazard in self.hazards.items():
            self.validate_position(hazard.position, "Hazard")
            if key != (hazard.position.x, hazard.position.y):
                raise ValueError("Hazard map keys must match hazard coordinates.")

        if self.hazard_at(self.start) is not None:
            raise ValueError("The start cannot be on a hazard.")
        if self.hazard_at(self.destination) is not None:
            raise ValueError("The destination cannot be on a hazard.")

    def validate_position(self, position: Position, label: str) -> None:
        if not (0 <= position.x < self.width and 0 <= position.y < self.height):
            raise ValueError(
                f"{label} coordinate {position} is outside the "
                f"{self.width}x{self.height} map."
            )

    def hazard_at(self, position: Position) -> Hazard | None:
        return self.hazards.get((position.x, position.y))

    def is_blocked(self, position: Position) -> bool:
        hazard = self.hazard_at(position)
        return hazard is not None and hazard.kind == "crater"

    def move_cost(self, current: Position, next_position: Position) -> float:
        distance = math.hypot(
            next_position.x - current.x,
            next_position.y - current.y,
        )
        hazard = self.hazard_at(next_position)
        if hazard is not None:
            distance += hazard.risk / 10
        return distance

    def neighbors(self, position: Position):
        for dx, dy in (
            (1, 0), (-1, 0), (0, 1), (0, -1),
            (1, 1), (1, -1), (-1, 1), (-1, -1),
        ):
            candidate = Position(position.x + dx, position.y + dy)
            if not (0 <= candidate.x < self.width and 0 <= candidate.y < self.height):
                continue
            if self.is_blocked(candidate):
                continue

            if dx != 0 and dy != 0:
                side_x = Position(position.x + dx, position.y)
                side_y = Position(position.x, position.y + dy)
                if self.is_blocked(side_x) or self.is_blocked(side_y):
                    continue

            yield candidate


class RoverAI:
    """Find a minimum-risk route through the entered map."""

    def __init__(self, planet: PlanetMap) -> None:
        self.planet = planet
        self.position = planet.start

    def detect_hazards(self, radius: int = 2) -> list[Hazard]:
        if radius < 0:
            raise ValueError("Scan radius cannot be negative.")

        detected = []
        for hazard in self.planet.hazards.values():
            distance = (
                abs(hazard.position.x - self.position.x)
                + abs(hazard.position.y - self.position.y)
            )
            if distance <= radius:
                detected.append(hazard)

        return sorted(
            detected,
            key=lambda hazard: (hazard.position.y, hazard.position.x),
        )

    def safest_path(self) -> list[Position]:
        start = self.position
        destination = self.planet.destination
        if start == destination:
            return [start]

        counter = 0
        queue: list[tuple[float, int, Position]] = [(0.0, counter, start)]
        costs = {start: 0.0}
        previous: dict[Position, Position | None] = {start: None}

        while queue:
            current_cost, _, current = heappop(queue)
            if current_cost != costs[current]:
                continue
            if current == destination:
                break

            for neighbor in self.planet.neighbors(current):
                new_cost = current_cost + self.planet.move_cost(current, neighbor)
                if new_cost < costs.get(neighbor, math.inf):
                    costs[neighbor] = new_cost
                    previous[neighbor] = current
                    counter += 1
                    heappush(queue, (new_cost, counter, neighbor))

        if destination not in previous:
            return []

        route = []
        position: Position | None = destination
        while position is not None:
            route.append(position)
            position = previous[position]
        route.reverse()
        return route


def prompt_integer(label: str, minimum: int = 0) -> int:
    while True:
        try:
            value = int(input(f"{label}: ").strip())
        except ValueError:
            print("Enter a whole number.")
            continue
        if value < minimum:
            print(f"Enter a number that is at least {minimum}.")
            continue
        return value


def parse_position(text: str) -> Position:
    try:
        x_text, y_text = text.split(",")
        return Position(int(x_text.strip()), int(y_text.strip()))
    except ValueError as exc:
        raise ValueError("Coordinates must use the format x,y.") from exc


def prompt_position(label: str, width: int, height: int) -> Position:
    while True:
        try:
            position = parse_position(input(f"{label} coordinate (x,y): "))
            if 0 <= position.x < width and 0 <= position.y < height:
                return position
        except ValueError:
            pass
        print(f"Enter valid coordinates inside the {width}x{height} map.")


def parse_hazards(entries: list[str]) -> dict[tuple[int, int], Hazard]:
    hazards = {}
    for entry in entries:
        parts = [part.strip() for part in entry.split(",")]
        if len(parts) != 3:
            raise ValueError(
                "Hazards must use x,y,type format, such as 3,5,crater."
            )

        try:
            position = Position(int(parts[0]), int(parts[1]))
        except ValueError as exc:
            raise ValueError(f"Invalid hazard coordinates: {entry}") from exc

        kind = parts[2].lower()
        if kind not in HAZARD_RISK:
            raise ValueError(f"Unknown hazard type '{kind}'. Use crater or bump.")

        hazards[(position.x, position.y)] = Hazard(
            kind=kind,
            position=position,
            risk=HAZARD_RISK[kind],
        )
    return hazards


def prompt_planet() -> PlanetMap:
    width = prompt_integer("Planet map width", minimum=1)
    height = prompt_integer("Planet map height", minimum=1)
    start = prompt_position("Rover start", width, height)
    destination = prompt_position("Destination", width, height)
    hazard_count = prompt_integer("Number of hazards", minimum=0)

    hazards = {}
    for index in range(1, hazard_count + 1):
        position = prompt_position(f"Hazard {index} position", width, height)
        kind = input("Hazard type (crater or bump): ").strip().lower()
        while kind not in HAZARD_RISK:
            print("Enter 'crater' or 'bump'.")
            kind = input("Hazard type (crater or bump): ").strip().lower()
        hazards[(position.x, position.y)] = Hazard(
            kind=kind,
            position=position,
            risk=HAZARD_RISK[kind],
        )

    return PlanetMap(width, height, start, destination, hazards)


def demo_planet() -> PlanetMap:
    width, height = 12, 9
    hazard_specs = [
        (3, 2, "bump"),
        (4, 2, "bump"),
        (5, 4, "crater"),
        (6, 4, "crater"),
        (7, 5, "bump"),
        (8, 6, "bump"),
        (8, 3, "crater"),
        (2, 5, "bump"),
    ]
    hazards = {
        (x, y): Hazard(kind, Position(x, y), HAZARD_RISK[kind])
        for x, y, kind in hazard_specs
    }
    return PlanetMap(
        width=width,
        height=height,
        start=Position(0, 0),
        destination=Position(10, 7),
        hazards=hazards,
    )


def render_map(
    planet: PlanetMap,
    route: list[Position],
    output_path: Path,
    show: bool,
) -> None:
    fig, ax = plt.subplots(figsize=(9, 7))
    ax.set_title("Planet Rover: Safest Route")
    ax.set_xlim(-0.5, planet.width - 0.5)
    ax.set_ylim(planet.height - 0.5, -0.5)
    ax.set_xticks(range(planet.width))
    ax.set_yticks(range(planet.height))
    ax.set_xlabel("X coordinate")
    ax.set_ylabel("Y coordinate")
    ax.set_facecolor("#f4f6f8")
    ax.grid(True, color="#c5ccd3")

    for hazard in planet.hazards.values():
        color = "#d72638" if hazard.kind == "crater" else "#ff8c42"
        marker = "o" if hazard.kind == "crater" else "s"
        ax.scatter(
            hazard.position.x,
            hazard.position.y,
            marker=marker,
            s=220,
            color=color,
            edgecolors="black",
            zorder=3,
        )
        ax.text(
            hazard.position.x,
            hazard.position.y,
            hazard.kind[0].upper(),
            ha="center",
            va="center",
            color="white",
            fontweight="bold",
            zorder=4,
        )

    if route:
        ax.plot(
            [position.x for position in route],
            [position.y for position in route],
            color="#00a6c8",
            linewidth=3,
            marker="o",
            markersize=5,
            label="Safest route",
            zorder=2,
        )

    ax.scatter(planet.start.x, planet.start.y, s=180, color="#2ecc71", label="Start", zorder=5)
    ax.scatter(
        planet.destination.x,
        planet.destination.y,
        s=180,
        color="#3498db",
        label="Destination",
        zorder=5,
    )
    ax.scatter([], [], marker="o", s=100, color="#d72638", label="Crater (blocked)")
    ax.scatter([], [], marker="s", s=100, color="#ff8c42", label="Bump (risk)")
    ax.legend(loc="upper left", bbox_to_anchor=(1.02, 1))

    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=180, bbox_inches="tight")
    if show:
        plt.show()
    plt.close(fig)


def create_terrain_model(torch, class_count: int):
    class TerrainCNN(torch.nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.features = torch.nn.Sequential(
                torch.nn.Conv2d(3, 16, kernel_size=3, padding=1),
                torch.nn.ReLU(),
                torch.nn.MaxPool2d(2),
                torch.nn.Conv2d(16, 32, kernel_size=3, padding=1),
                torch.nn.ReLU(),
                torch.nn.MaxPool2d(2),
                torch.nn.Conv2d(32, 64, kernel_size=3, padding=1),
                torch.nn.ReLU(),
                torch.nn.AdaptiveAvgPool2d((1, 1)),
            )
            self.classifier = torch.nn.Linear(64, class_count)

        def forward(self, images):
            features = self.features(images)
            return self.classifier(torch.flatten(features, 1))

    return TerrainCNN()


def train_terrain_model(
    data_dir: Path,
    model_path: Path,
    epochs: int = 100,
) -> None:
    try:
        import random

        import numpy as np
        import torch
        from PIL import Image, ImageEnhance, ImageOps
        from torch.utils.data import DataLoader, Dataset
    except ImportError as exc:
        raise RuntimeError(
            "Training requires PyTorch, NumPy, and Pillow. "
            "Install them with: python -m pip install torch numpy pillow"
        ) from exc

    if epochs <= 0:
        raise ValueError("Training epochs must be positive.")
    if not data_dir.is_dir():
        raise ValueError(f"Training folder does not exist: {data_dir}")

    supported_extensions = {".jpg", ".jpeg", ".png", ".bmp"}
    class_images = {
        folder.name: sorted(
            path
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in supported_extensions
        )
        for folder in data_dir.iterdir()
        if folder.is_dir()
    }
    class_images = {
        name: images for name, images in class_images.items() if images
    }
    classes = sorted(class_images)
    if len(classes) < 2:
        raise ValueError(
            f"Need image folders for at least 2 classes inside {data_dir}."
        )

    print("Training images per class:")
    for name in classes:
        print(f"  {name}: {len(class_images[name])}")
    if min(len(class_images[name]) for name in classes) < 10:
        print(
            "WARNING: Very few images are available. This run is a learning "
            "demo and is unlikely to generalize to new terrain."
        )

    samples = [
        (path, label)
        for label, name in enumerate(classes)
        for path in class_images[name]
    ]

    class TerrainDataset(Dataset):
        def __len__(self):
            return len(samples)

        def __getitem__(self, index):
            path, label = samples[index]
            with Image.open(path) as image_file:
                image = image_file.convert("RGB")
            image = ImageOps.fit(image, (64, 64))

            if random.random() < 0.5:
                image = ImageOps.mirror(image)
            image = image.rotate(random.choice((0, 90, 180, 270)))
            image = ImageEnhance.Brightness(image).enhance(
                random.uniform(0.85, 1.15)
            )

            pixels = np.asarray(image, dtype=np.float32) / 255.0
            tensor = torch.from_numpy(pixels).permute(2, 0, 1)
            return tensor, label

    torch.manual_seed(7)
    random.seed(7)
    loader = DataLoader(
        TerrainDataset(),
        batch_size=min(8, len(samples)),
        shuffle=True,
        num_workers=0,
    )
    model = create_terrain_model(torch, len(classes))
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    loss_function = torch.nn.CrossEntropyLoss()

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        seen = 0
        for images, labels in loader:
            optimizer.zero_grad()
            outputs = model(images)
            loss = loss_function(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * labels.size(0)
            correct += (outputs.argmax(dim=1) == labels).sum().item()
            seen += labels.size(0)

        if epoch == 1 or epoch % 10 == 0 or epoch == epochs:
            print(
                f"Epoch {epoch}/{epochs} — loss: {total_loss / seen:.4f}, "
                f"training accuracy: {correct / seen:.0%}"
            )

    model_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "state_dict": model.state_dict(),
            "classes": classes,
            "image_size": 64,
        },
        model_path,
    )
    print(f"Model saved to: {model_path.resolve()}")
    print(
        "Training accuracy is measured on the same images used for training; "
        "it is not a measure of real-world accuracy."
    )


def open_camera(cv2, camera_index: int):
    candidates = [
        (camera_index, getattr(cv2, "CAP_DSHOW", cv2.CAP_ANY)),
        (camera_index, getattr(cv2, "CAP_MSMF", cv2.CAP_ANY)),
        (camera_index, cv2.CAP_ANY),
    ]
    for fallback_index in range(3):
        if fallback_index != camera_index:
            candidates.append((fallback_index, cv2.CAP_ANY))

    attempted = set()
    for index, backend in candidates:
        if (index, backend) in attempted:
            continue
        attempted.add((index, backend))
        camera = cv2.VideoCapture(index, backend)
        if camera.isOpened():
            return camera
        camera.release()
    return None


def run_camera(
    model_path: Path,
    camera_index: int = 0,
    training_data_dir: Path | None = None,
    collect_data: bool = False,
) -> None:
    try:
        import numpy as np
        import torch
        import cv2
        from PIL import Image, ImageOps
        from datetime import datetime
        import platform
        import sys
    except ImportError as exc:
        raise RuntimeError(
            "Camera mode requires PyTorch, NumPy, Pillow, and OpenCV. "
            "Install dependencies with: python -m pip install -r requirements.txt"
        ) from exc

    if training_data_dir is None:
        training_data_dir = Path(__file__).with_name("training_data")

    model = None
    classes: list[str] = []
    image_size = 64
    if model_path.is_file():
        checkpoint = torch.load(model_path, map_location="cpu", weights_only=True)
        classes = checkpoint["classes"]
        image_size = checkpoint["image_size"]
        model = create_terrain_model(torch, len(classes))
        model.load_state_dict(checkpoint["state_dict"])
        model.eval()
    elif not collect_data:
        raise ValueError(
            f"Trained model not found: {model_path}. Run with --train-model first."
        )

    camera = open_camera(cv2, camera_index)
    if camera is None:
        if (
            platform.machine().upper() == "ARM64"
            and "AMD64" in sys.version.upper()
        ):
            raise RuntimeError(
                "OpenCV could not open the camera. This PC is ARM64, but the "
                "active Python is an AMD64 build; that compatibility setup may "
                "not expose the Qualcomm camera to OpenCV. Use a native ARM64 "
                "Python/OpenCV camera backend, or run this on a system where "
                "OpenCV can open the webcam."
            )
        raise RuntimeError(
            f"No camera could be opened (tried index {camera_index} and fallback "
            "indices). Check Windows camera privacy permissions, close other "
            "camera apps, or try --camera-index 1."
        )

    print("Camera started. Press Q to quit.")
    if collect_data:
        print("Press B to save a bump, C for a crater, or N for clear terrain.")
    try:
        while True:
            success, frame = camera.read()
            if not success:
                raise RuntimeError(
                    "The camera opened but returned no frame. Check that it is "
                    "not being used by another app."
                )
            clean_frame = frame.copy()

            if model is not None:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image = ImageOps.fit(
                    Image.fromarray(rgb_frame),
                    (image_size, image_size),
                )
                pixels = np.asarray(image, dtype=np.float32) / 255.0
                tensor = torch.from_numpy(pixels).permute(2, 0, 1).unsqueeze(0)

                with torch.no_grad():
                    probabilities = torch.softmax(model(tensor), dim=1)[0]
                class_index = int(probabilities.argmax().item())
                label = classes[class_index]
                confidence = float(probabilities[class_index].item())
                caption = f"{label} (model score {confidence:.0%})"
            else:
                caption = "Data collection mode"

            cv2.putText(
                frame,
                caption,
                (15, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 255),
                2,
                cv2.LINE_AA,
            )
            if collect_data:
                cv2.putText(
                    frame,
                    "B=bump  C=crater  N=clear  Q=quit",
                    (15, 70),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.65,
                    (255, 255, 255),
                    2,
                    cv2.LINE_AA,
                )
            cv2.imshow("Terrain camera", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if collect_data and key in (ord("b"), ord("c"), ord("n")):
                class_name = {
                    ord("b"): "bump",
                    ord("c"): "crater",
                    ord("n"): "clear",
                }[key]
                class_dir = training_data_dir / class_name
                class_dir.mkdir(parents=True, exist_ok=True)
                filename = f"{datetime.now():%Y%m%d_%H%M%S_%f}.jpg"
                image_path = class_dir / filename
                if not cv2.imwrite(str(image_path), clean_frame):
                    raise RuntimeError(f"Could not save captured image: {image_path}")
                print(f"Saved {class_name} sample: {image_path}")
    finally:
        camera.release()
        cv2.destroyAllWindows()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Plan a rover route around entered craters and bumps."
    )
    parser.add_argument("--width", type=int, help="Map width in cells")
    parser.add_argument("--height", type=int, help="Map height in cells")
    parser.add_argument("--start", help="Start coordinate, for example 0,0")
    parser.add_argument("--destination", help="Destination coordinate, for example 10,7")
    parser.add_argument(
        "--hazard",
        action="append",
        default=[],
        help="Hazard as x,y,type; repeat for multiple hazards",
    )
    parser.add_argument("--demo", action="store_true", help="Run the sample map")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).with_name("planet_safe_route.png"),
        help="Where to save the route image",
    )
    parser.add_argument(
        "--no-show",
        action="store_true",
        help="Save the image without opening a window",
    )
    parser.add_argument(
        "--train-model",
        action="store_true",
        help="Train a PyTorch terrain classifier from labeled image folders",
    )
    parser.add_argument(
        "--camera",
        action="store_true",
        help="Classify live camera frames using the saved terrain model",
    )
    parser.add_argument(
        "--camera-index",
        type=int,
        default=0,
        help="Camera device index to try first (default: 0)",
    )
    parser.add_argument(
        "--collect-data",
        action="store_true",
        help="Capture labeled webcam frames with B, C, and N keys",
    )
    parser.add_argument(
        "--training-data",
        type=Path,
        default=Path(__file__).with_name("training_data"),
        help="Folder containing one subfolder per terrain class",
    )
    parser.add_argument(
        "--model",
        type=Path,
        default=Path(__file__).with_name("terrain_model.pth"),
        help="Path for the trained PyTorch model",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=100,
        help="Training epochs (default: 100)",
    )
    args = parser.parse_args()

    try:
        if args.train_model and args.camera:
            parser.error("Choose either --train-model or --camera, not both.")
        if args.collect_data and not args.camera:
            parser.error("--collect-data requires --camera.")
        if args.train_model:
            train_terrain_model(args.training_data, args.model, args.epochs)
            return
        if args.camera:
            if args.camera_index < 0:
                parser.error("--camera-index must be zero or greater.")
            run_camera(
                args.model,
                args.camera_index,
                training_data_dir=args.training_data,
                collect_data=args.collect_data,
            )
            return

        map_options = (
            args.width is not None,
            args.height is not None,
            args.start is not None,
            args.destination is not None,
        )
        if args.demo:
            planet = demo_planet()
        elif any(map_options):
            if not all(map_options):
                parser.error(
                    "Provide --width, --height, --start, and --destination together."
                )
            planet = PlanetMap(
                width=args.width,
                height=args.height,
                start=parse_position(args.start),
                destination=parse_position(args.destination),
                hazards=parse_hazards(args.hazard),
            )
        else:
            planet = prompt_planet()

        rover = RoverAI(planet)
        detected = rover.detect_hazards()
        route = rover.safest_path()

        print(f"Rover position: {rover.position}")
        print(f"Destination: {planet.destination}")
        print(f"Hazards detected within scan radius: {len(detected)}")
        for hazard in detected:
            print(f"  {hazard.kind.title()} at {hazard.position}")

        if route:
            total_cost = sum(
                planet.move_cost(route[index], route[index + 1])
                for index in range(len(route) - 1)
            )
            print(f"Safest route ({len(route)} waypoints):")
            print(" -> ".join(str(position) for position in route))
            print(f"Route risk cost: {total_cost:.2f}")
        else:
            print("No safe route found; the destination may be blocked by craters.")

        render_map(planet, route, args.output, show=not args.no_show)
        print(f"Map saved to: {args.output.resolve()}")

    except (RuntimeError, ValueError) as exc:
        parser.error(str(exc))

#h
if __name__ == "__main__":
    main()