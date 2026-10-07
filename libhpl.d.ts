declare namespace hpl {
  type int = number;
  type float = number;
  type RefType = "int" | "bool" | "float" | "str";
  type Raw = int | float | boolean | string;
  const hplObjectBrand: unique symbol;
  const sliceBrand: unique symbol;
  const mapBrand: unique symbol;
  const tupleBrand: unique symbol;
  const setBrand: unique symbol;
  interface HplObject { readonly [hplObjectBrand]: true; }
  interface slice<T = unknown> extends HplObject { readonly [sliceBrand]: T; readonly length: int; readonly [index: number]: T; }
  interface map<K = unknown, V = unknown> extends HplObject { readonly [mapBrand]: readonly [K, V]; readonly size: int; }
  interface tuple<T extends readonly unknown[] = readonly unknown[]> extends HplObject { readonly [tupleBrand]: T; readonly length: T["length"]; readonly [index: number]: T[number]; }
  interface set<T = unknown> extends HplObject { readonly [setBrand]: T; readonly size: int; }
  abstract class HplFunc { protected constructor(); }
  type HplMethodDecorator = <This, Args extends unknown[], Result>(
    value: (this: This, ...args: Args) => Result,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Result>,
  ) => void;
  function hplFunc(name?: string): HplMethodDecorator;
  function hplEvent(event: string, name?: string): HplMethodDecorator;

  /** Type conversion functions */
  function int(value: number | string | boolean): int;
  function float(value: number | string | boolean): float;
  function str(value: Raw): string;
  function bool(value: Raw): boolean;

  /** @hplIntrinsic ref @hplReturns int */ function ref(type: "int", index: int): int;
  /** @hplIntrinsic ref @hplReturns bool */ function ref(type: "bool", index: int): boolean;
  /** @hplIntrinsic ref @hplReturns float */ function ref(type: "float", index: int): float;
  /** @hplIntrinsic ref @hplReturns str */ function ref(type: "str", index: int): string;
  /** @hplIntrinsic command @hplReturns int */ function command(line: string): int;
  /** @hplIntrinsic selector @hplReturns str */ function selector(target: string): string;
  /** @hplIntrinsic score @hplReturns int */ function score(target: string, objective: string): int;

  namespace slices {
    /** @hplFunc slices.new @hplReturns pointer */ function new_<T extends Raw>(...elements: T[]): slice<T>;
    /** @hplFunc slices.make @hplReturns pointer */ function make<T extends Raw>(length: int, value: T): slice<T>;
    /** @hplFunc slices.length @hplReturns int */ function length(value: slice<unknown>): int;
    /** @hplFunc slices.get @hplReturns unknown */ function get<T extends Raw>(value: slice<T>, index: int): T;
    /** @hplFunc slices.ptr_get @hplReturns pointer */ function ptrGet<T extends HplObject>(value: slice<T>, index: int): T;
    /** @hplFunc slices.set @hplReturns bool */ function set<T extends Raw>(value: slice<T>, index: int, element: T): boolean;
    /** @hplFunc slices.ptr_set @hplReturns bool */ function ptrSet<T extends HplObject>(value: slice<T>, index: int, element: T): boolean;
    /** @hplFunc slices.append @hplReturns bool */ function append<T extends Raw>(value: slice<T>, element: T): boolean;
    /** @hplFunc slices.ptr_append @hplReturns bool */ function ptrAppend<T extends HplObject>(value: slice<T>, element: T): boolean;
    /** @hplFunc slices.pop @hplReturns unknown */ function pop<T extends Raw>(value: slice<T>): T;
    /** @hplFunc slices.ptr_pop @hplReturns pointer */ function ptrPop<T extends HplObject>(value: slice<T>): T;
  }
  namespace maps {
    /** @hplFunc maps.length @hplReturns int */ function length(value: map<unknown, unknown>): int;
    /** @hplFunc maps.get @hplReturns unknown */ function get<K extends Raw, V extends Raw>(value: map<K, V>, key: K): V;
    /** @hplFunc maps.ptr_get @hplReturns pointer */ function ptrGet<K extends HplObject, V extends HplObject>(value: map<K, V>, key: K): V;
    /** @hplFunc maps.set @hplReturns bool */ function set<K extends Raw, V extends Raw>(value: map<K, V>, key: K, element: V): boolean;
    /** @hplFunc maps.ptr_set @hplReturns bool */ function ptrSet<K extends HplObject, V extends HplObject>(value: map<K, V>, key: K, element: V): boolean;
    /** @hplFunc maps.exist @hplReturns bool */ function exist<K extends Raw>(value: map<K, unknown>, key: K): boolean;
    /** @hplFunc maps.ptr_exist @hplReturns bool */ function ptrExist<K extends HplObject>(value: map<K, unknown>, key: K): boolean;
  }
  namespace sets {
    /** @hplFunc set.new @hplReturns pointer */ function new_<T extends Raw>(...elements: T[]): set<T>;
    /** @hplFunc set.length @hplReturns int */ function length(value: set<unknown>): int;
    /** @hplFunc set.exist @hplReturns bool */ function exist<T extends Raw>(value: set<T>, element: T): boolean;
    /** @hplFunc set.ptr_exist @hplReturns bool */ function ptrExist<T extends HplObject>(value: set<T>, element: T): boolean;
    /** @hplFunc set.add @hplReturns bool */ function add<T extends Raw>(value: set<T>, element: T): boolean;
    /** @hplFunc set.ptr_add @hplReturns bool */ function ptrAdd<T extends HplObject>(value: set<T>, element: T): boolean;
    /** @hplFunc set.discard @hplReturns bool */ function discard<T extends Raw>(value: set<T>, element: T): boolean;
    /** @hplFunc set.ptr_discard @hplReturns bool */ function ptrDiscard<T extends HplObject>(value: set<T>, element: T): boolean;
  }

  namespace command {
    /** @hplFunc command.fast_set @hplReturns bool */ function fastSet(selectorOrEntityId: string, isSelector?: boolean): boolean;
    /** @hplFunc command.get_executor @hplReturns str */ function getExecutor(): string;
    /** @hplFunc command.set_executor @hplReturns bool */ function setExecutor(executor: string): boolean;
    /** @hplFunc command.get_position @hplReturns pointer */ function getPosition(): tuple<readonly [float, float, float]>;
    /** @hplFunc command.set_position @hplReturns bool */ function setPosition(x: float, y: float, z: float): boolean;
    /** @hplFunc command.get_dimension @hplReturns int */ function getDimension(): int;
    /** @hplFunc command.set_dimension @hplReturns bool */ function setDimension(dimensionId: int): boolean;
    /** @hplFunc command.dimension_name @hplReturns str */ function dimensionName(): string;
  }
  namespace utils {
    /** @hplFunc utils.texture_by_keyword @hplReturns pointer */ function textureByKeyword(keyword?: string, pageSplit?: boolean): slice<string>;
    /** @hplFunc utils.add_ench @hplReturns bool */ function addEnch(entityId: string, posType: int, slotPos: int, enchantId: int, enchantLevel: int): boolean;
    /** @hplFunc utils.del_ench @hplReturns bool */ function delEnch(entityId: string, posType: int, slotPos: int, enchantId: int): boolean;
    /** @hplFunc utils.async_run_func @hplReturns bool */ function asyncRunFunc(delay: float, functionName: string, ...args: Raw[]): boolean;
    /** @hplFunc utils.async_run_cmd @hplReturns bool */ function asyncRunCmd(delay: float, line: string): boolean;
  }
  namespace general {
    /** @hplFunc general.BroadcastEvent @hplReturns bool */ function broadcastEvent(eventName: string, eventData: HplObject): boolean;
    /** @hplFunc general.BroadcastToAllClient @hplReturns bool */ function broadcastToAllClient(eventName: string, eventData: HplObject): boolean;
    /** @hplFunc general.GetEngineNamespace @hplReturns pointer */ function getEngineNamespace(): string;
    /** @hplFunc general.GetEngineSystemName @hplReturns pointer */ function getEngineSystemName(): string;
    /** @hplFunc general.NotifyToClient @hplReturns bool */ function notifyToClient(playerId: string, eventName: string, eventData: HplObject): boolean;
    /** @hplFunc general.NotifyToMultiClients @hplReturns bool */ function notifyToMultiClients(playerIds: slice<string>, eventName: string, eventData: HplObject): boolean;
    /** @hplFunc general.GetMinecraftVersion @hplReturns pointer */ function getMinecraftVersion(): string;
    /** @hplFunc general.GetPlatform @hplReturns pointer */ function getPlatform(): int;
    /** @hplFunc general.GetHostPlayerId @hplReturns pointer */ function getHostPlayerId(): string;
    /** @hplFunc general.GetServerTickTime @hplReturns pointer */ function getServerTickTime(): int;
  }
  namespace world {
    /** @hplFunc world.GetPlayerList @hplReturns pointer */ function getPlayerList(): slice<string>;
    /** @hplFunc world.GetLevelId @hplReturns pointer */ function getLevelId(): string;
    /** @hplFunc world.GetEntityLimit @hplReturns pointer */ function getEntityLimit(): int;
    /** @hplFunc world.SetEntityLimit @hplReturns pointer */ function setEntityLimit(limit: int): boolean;
    /** @hplFunc world.GetLevelGravity @hplReturns pointer */ function getLevelGravity(): float;
    /** @hplFunc world.SetLevelGravity @hplReturns pointer */ function setLevelGravity(gravity: float): boolean;
    /** @hplFunc world.GetBiomeName @hplReturns pointer */ function getBiomeName(position: tuple<readonly [float, float, float]>, dimensionId?: int): string;
    /** @hplFunc world.GetBlockLightLevel @hplReturns pointer */ function getBlockLightLevel(position: tuple<readonly [float, float, float]>, dimensionId?: int): int;
    /** @hplFunc world.CreateExplosion @hplReturns pointer */ function createExplosion(position: tuple<readonly [float, float, float]>, radius: float, causesFire: boolean, breaksBlocks: boolean, sourceId: string, playerId: string): boolean;
    /** @hplFunc world.GetEntitiesAround @hplReturns pointer */ function getEntitiesAround(entityId: string, radius: float, filters: HplObject): slice<string>;
  }
  namespace entity {
    /** @hplFunc entity.GetEngineTypeStr @hplReturns pointer */ function getEngineTypeStr(entityId: string): string;
    /** @hplFunc entity.GetEntityDimensionId @hplReturns pointer */ function getDimensionId(entityId: string): int;
    /** @hplFunc entity.GetFootPos @hplReturns pointer */ function getFootPos(entityId: string): tuple<readonly [float, float, float]>;
    /** @hplFunc entity.GetName @hplReturns pointer */ function getName(entityId: string): string;
    /** @hplFunc entity.GetPos @hplReturns pointer */ function getPos(entityId: string): tuple<readonly [float, float, float]>;
    /** @hplFunc entity.GetRot @hplReturns pointer */ function getRot(entityId: string): tuple<readonly [float, float]>;
    /** @hplFunc entity.GetAttrValue @hplReturns pointer */ function getAttrValue(entityId: string, attributeType: int): float;
    /** @hplFunc entity.HasComponent @hplReturns pointer */ function hasComponent(entityId: string, componentName: string): boolean;
    /** @hplFunc entity.IsBaby @hplReturns pointer */ function isBaby(entityId: string): boolean;
    /** @hplFunc entity.SetName @hplReturns pointer */ function setName(entityId: string, name: string): boolean;
    /** @hplFunc entity.SetPos @hplReturns pointer */ function setPos(entityId: string, position: tuple<readonly [float, float, float]>): boolean;
    /** @hplFunc entity.SetRot @hplReturns pointer */ function setRot(entityId: string, rotation: tuple<readonly [float, float]>): boolean;
    /** @hplFunc entity.SetMobKnockback @hplReturns bool */ function setMobKnockback(entityId: string, xDirection?: float, zDirection?: float, power?: float, height?: float, heightCap?: float): boolean;
    /** @hplFunc entity.SetPersistence @hplReturns bool */ function setPersistence(entityId: string, persistent: boolean): boolean;
  }
  namespace player {
    /** @hplFunc player.GetPlayerExp @hplReturns pointer */ function getExp(playerId: string, asPercent?: boolean): float;
    /** @hplFunc player.GetPlayerHunger @hplReturns pointer */ function getHunger(playerId: string): int;
    /** @hplFunc player.GetPlayerTotalExp @hplReturns pointer */ function getTotalExp(playerId: string): int;
    /** @hplFunc player.SetPlayerHunger @hplReturns pointer */ function setHunger(playerId: string, value: int): boolean;
    /** @hplFunc player.ChangePlayerDimension @hplReturns pointer */ function changeDimension(playerId: string, dimensionId: int, position: tuple<readonly [float, float, float]>): boolean;
    /** @hplFunc player.ChangePlayerFlyState @hplReturns pointer */ function changeFlyState(playerId: string, canFly: boolean, enterFly?: boolean): boolean;
    /** @hplFunc player.IsPlayerCanFly @hplReturns pointer */ function canFly(playerId: string): boolean;
    /** @hplFunc player.IsPlayerFlying @hplReturns pointer */ function isFlying(playerId: string): boolean;
    /** @hplFunc player.GetPlayerGameType @hplReturns pointer */ function getGameType(playerId: string): int;
    /** @hplFunc player.SetPlayerGameType @hplReturns pointer */ function setGameType(playerId: string, gameType: int): boolean;
    /** @hplFunc player.GetSelectSlotId @hplReturns pointer */ function getSelectedSlot(playerId: string): int;
    /** @hplFunc player.ChangeSelectSlot @hplReturns pointer */ function changeSelectedSlot(playerId: string, slot: int): boolean;
    /** @hplFunc player.isSneaking @hplReturns pointer */ function isSneaking(playerId: string): boolean;
    /** @hplFunc player.isSwimming @hplReturns pointer */ function isSwimming(playerId: string): boolean;
  }
  namespace compile {
    /** @hplFunc compile.get_max_cache_size @hplReturns int */ function getMaxCacheSize(): int;
    /** @hplFunc compile.get_current_cache_size @hplReturns int */ function getCurrentCacheSize(): int;
    /** @hplFunc compile.set_max_cache_size @hplReturns bool */ function setMaxCacheSize(size: int): boolean;
    /** @hplFunc compile.register_cache @hplReturns bool */ function registerCache(code: string): boolean;
  }
  namespace object {
    /** @hplFunc object.ref @hplReturns pointer */ function ref(value: Raw | HplObject): int;
    /** @hplFunc object.can_deref @hplReturns bool */ function canDeref(ptr: int): boolean;
    /** @hplFunc object.deref @hplReturns unknown */ function deref(ptr: int): Raw;
    /** @hplFunc object.release @hplReturns bool */ function release(ptr: int): boolean;
    /** @hplFunc object.pin @hplReturns bool */ function pin(ptr: int): boolean;
    /** @hplFunc object.finalise @hplReturns bool */ function finalise(ptr: int): boolean;
    /** @hplFunc object.make_none @hplReturns pointer */ function makeNone(): int;
    /** @hplFunc object.is_ptr @hplReturns bool */ function isPtr(ptr: int): boolean;
    /** @hplFunc object.is_none @hplReturns bool */ function isNone(ptr: int): boolean;
    /** @hplFunc object.raw_type @hplReturns int */ function rawType(value: Raw): int;
    /** @hplFunc object.ref_type @hplReturns int */ function refType(ptr: int): int;
  }
  namespace reflect {
    /** @hplFunc reflect.cast @hplReturns unknown */ function cast(ptr: int): Raw;
    /** @hplFunc reflect.format @hplReturns str */ function format(ptr: int, accuracy?: int): string;
    /** @hplFunc reflect.length @hplReturns int */ function length(ptr: int): int;
    /** @hplFunc reflect.copy @hplReturns pointer */ function copy(ptr: int): int;
    /** @hplFunc reflect.deepcopy @hplReturns pointer */ function deepcopy(ptr: int): int;
    /** @hplFunc reflect.vars @hplReturns pointer */ function vars(ptr: int): int;
    /** @hplFunc reflect.dir @hplReturns pointer */ function dir(ptr: int): int;
    /** @hplFunc reflect.hasattr @hplReturns bool */ function hasattr(ptr: int, name: string): boolean;
    /** @hplFunc reflect.getattr @hplReturns unknown */ function getattr(ptr: int, name: string): Raw;
    /** @hplFunc reflect.setattr @hplReturns bool */ function setattr(ptr: int, name: string, value: Raw): boolean;
    /** @hplFunc reflect.delattr @hplReturns bool */ function delattr(ptr: int, name: string): boolean;
    /** @hplFunc reflect.callable @hplReturns bool */ function callable(ptr: int): boolean;
    /** @hplFunc reflect.call @hplReturns unknown */ function call(ptr: int, args: int): Raw;
  }
  namespace block {
    /** @hplFunc block.GetBlockStates @hplReturns pointer */ function getStates(position: tuple<readonly [float, float, float]>, dimensionId?: int): HplObject;
    /** @hplFunc block.ExecuteCommandBlock @hplReturns pointer */ function executeCommandBlock(position: tuple<readonly [float, float, float]>, dimensionId: int): boolean;
    /** @hplFunc block.GetBlockEntityData @hplReturns pointer */ function getEntityData(dimensionId: int, position: tuple<readonly [float, float, float]>): HplObject;
    /** @hplFunc block.GetContainerItem @hplReturns pointer */ function getContainerItem(position: tuple<readonly [float, float, float]>, slot: int, dimensionId?: int, withUserData?: boolean): HplObject;
    /** @hplFunc block.GetContainerSize @hplReturns pointer */ function getContainerSize(position: tuple<readonly [float, float, float]>, dimensionId?: int): int;
    /** @hplFunc block.GetBlockPoweredState @hplReturns pointer */ function getPoweredState(position: tuple<readonly [float, float, float]>, dimensionId: int): boolean;
    /** @hplFunc block.GetStrength @hplReturns pointer */ function getStrength(position: tuple<readonly [float, float, float]>, dimensionId?: int): float;
    /** @hplFunc block.GetSignBlockText @hplReturns pointer */ function getSignText(position: tuple<readonly [float, float, float]>, dimensionId?: int, side?: int): string;
  }
  namespace item {
    /** @hplFunc item.GetAllEnchantsInfo @hplReturns pointer */ function getAllEnchantsInfo(): HplObject;
    /** @hplFunc item.GetItemDurability @hplReturns pointer */ function getDurability(playerId: string, posType: int, slotPos: int): int;
    /** @hplFunc item.GetItemInfoByBlockName @hplReturns pointer */ function getInfoByBlockName(blockName: string, auxValue?: int, legacy?: boolean): HplObject;
    /** @hplFunc item.GetItemMaxDurability @hplReturns pointer */ function getMaxDurability(playerId: string, posType: int, slotPos: int, withUserData: boolean): int;
    /** @hplFunc item.SetItemDurability @hplReturns pointer */ function setDurability(playerId: string, posType: int, slotPos: int, durability: int): boolean;
  }
}
