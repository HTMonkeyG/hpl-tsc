import type { MappingDescriptor } from "../mappings/registry.js";

export const CATALOG_VERSION = 1 as const;
export const RAW_PTR_SUPPORT = Object.freeze({
  slice: {
    get: { raw: "slices.get", ptr: "slices.ptr_get" },
    set: { raw: "slices.set", ptr: "slices.ptr_set" },
    append: { raw: "slices.append", ptr: "slices.ptr_append" },
    pop: { raw: "slices.pop", ptr: "slices.ptr_pop" },
    includes: { raw: "slices.in", ptr: "slices.ptr_in" },
  },
  map: {
    get: { raw: "maps.get", ptr: "maps.ptr_get", convention: "key-and-value-must-share-convention" },
    set: { raw: "maps.set", ptr: "maps.ptr_set", convention: "key-and-value-must-share-convention" },
    has: { raw: "maps.exist", ptr: "maps.ptr_exist", convention: "key-selects-convention" },
    delete: { raw: "maps.del", ptr: "maps.ptr_del", convention: "key-selects-convention" },
  },
  set: {
    has: { raw: "set.exist", ptr: "set.ptr_exist" },
    add: { raw: "set.add", ptr: "set.ptr_add" },
    delete: { raw: "set.discard", ptr: "set.ptr_discard" },
    pop: { raw: "set.pop", ptr: "set.ptr_pop" },
  },
} as const);

export const DYNAMIC_API_NAMES = Object.freeze([
  "command.fast_set", "command.get_executor", "command.set_executor", "command.get_position",
  "command.set_position", "command.get_dimension", "command.set_dimension", "command.dimension_name",
  "utils.texture_by_keyword", "utils.add_ench", "utils.del_ench", "utils.async_run_func", "utils.async_run_cmd",
  "general.BroadcastEvent", "general.BroadcastToAllClient", "general.GetEngineNamespace",
  "general.GetEngineSystemName", "general.NotifyToClient", "general.NotifyToMultiClients",
  "general.GetMinecraftVersion", "general.GetPlatform", "general.GetHostPlayerId", "general.GetServerTickTime",
  "world.GetPlayerList", "world.GetLevelId", "world.GetEntityLimit", "world.SetEntityLimit",
  "world.GetLevelGravity", "world.SetLevelGravity", "world.GetBiomeName", "world.GetBlockLightLevel",
  "world.CreateExplosion", "world.GetEntitiesAround", "entity.GetEngineTypeStr", "entity.GetEntityDimensionId",
  "entity.GetFootPos", "entity.GetName", "entity.GetPos", "entity.GetRot", "entity.GetAttrValue",
  "entity.HasComponent", "entity.IsBaby", "entity.SetName", "entity.SetPos", "entity.SetRot",
  "entity.SetMobKnockback", "entity.SetPersistence", "player.GetPlayerExp", "player.GetPlayerHunger",
  "player.GetPlayerTotalExp", "player.SetPlayerHunger", "player.ChangePlayerDimension", "player.ChangePlayerFlyState",
  "player.IsPlayerCanFly", "player.IsPlayerFlying", "player.GetPlayerGameType", "player.SetPlayerGameType",
  "player.GetSelectSlotId", "player.ChangeSelectSlot", "player.isSneaking", "player.isSwimming",
  "block.GetBlockStates", "block.ExecuteCommandBlock", "block.GetBlockEntityData", "block.GetContainerItem",
  "block.GetContainerSize", "block.GetBlockPoweredState", "block.GetStrength", "block.GetSignBlockText",
  "item.GetAllEnchantsInfo", "item.GetItemDurability", "item.GetItemInfoByBlockName",
  "item.GetItemMaxDurability", "item.SetItemDurability",
  "object.ref", "object.can_deref", "object.deref", "object.release", "object.pin", "object.finalise",
  "object.make_none", "object.is_ptr", "object.is_none", "object.raw_type", "object.ref_type",
  "reflect.cast", "reflect.format", "reflect.length", "reflect.copy", "reflect.deepcopy",
  "reflect.vars", "reflect.dir", "reflect.hasattr", "reflect.getattr", "reflect.setattr",
  "reflect.delattr", "reflect.callable", "reflect.call",
] as const);

export interface RuntimeCatalog {
  readonly version: typeof CATALOG_VERSION;
  readonly standard: readonly MappingDescriptor[];
  readonly rawPtr: typeof RAW_PTR_SUPPORT;
  readonly dynamicApis: readonly string[];
}
