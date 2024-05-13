import type { Image } from "@owlbear-rodeo/sdk";
import OBR, { buildText } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";

export async function attachCounterToItemWithNumber(
  item: Image,
  number: number
) {
  const dpi = await OBR.scene.grid.getDpi();

  const dpiScale = dpi / item.grid.dpi;
  const width = item.image.width * dpiScale;
  const height = item.image.height * dpiScale;
  const offsetX =
    (item.grid.offset.x / item.image.width) * item.scale.x * width;
  const offsetY =
    (item.grid.offset.y / item.image.height) * item.scale.y * height;
  // Apply offset so the text origin is the top left
  const position = {
    x: item.position.x - offsetX,
    y: item.position.y - offsetY,
  };

  const txt = buildText()
    .textType("PLAIN")
    .plainText(`${number}`)
    .fontSize(52)
    .scale({ x: item.scale.x, y: item.scale.y })
    .position(position)
    .fillColor("red")
    .strokeColor("white")
    .strokeWidth(1)
    .strokeOpacity(1)
    .attachedTo(item.id)
    .locked(false)
    .name("Token Counter")
    .metadata({ [getPluginId("metadata")]: { enabled: true } })
    .layer("NOTE")
    .disableHit(false)
    .build();

  OBR.scene.items.addItems([txt]);
}
