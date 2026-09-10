type EntityId = string;
type PlayerId = string;
type DimensionId = hpl.int;
type BlockPos = hpl.tuple<readonly [hpl.int, hpl.int, hpl.int]>;
type Vec3 = hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>;
type Rotation = hpl.tuple<readonly [hpl.float, hpl.float]>;
interface EntityObject extends hpl.HplObject { readonly entityId?: EntityId; }
interface PlayerObject extends EntityObject { readonly playerId?: PlayerId; }
interface ItemDict extends hpl.HplObject { readonly itemName?: string; readonly count?: hpl.int; readonly auxValue?: hpl.int; }
interface BlockObject extends hpl.HplObject { readonly blockName?: string; readonly auxValue?: hpl.int; }
interface EffectObject extends hpl.HplObject {}

type GameType = 0 | 1 | 2 | 3;
type DimensionType = 0 | 1 | 2;
type ItemPosType = 0 | 1 | 2 | 3;
type ActorType = hpl.int;
type AttributeType = hpl.int;
type DamageCause = hpl.int;
type EnchantType = hpl.int;
type Facing = 0 | 1 | 2 | 3 | 4 | 5;

interface ServerChatEventArgs {
  cancel: boolean;
  message: string;
  playerId: PlayerId;
  username: string;
}
interface ServerItemTryUseEventArgs {
  cancel: boolean;
  playerId: PlayerId;
  itemDict: ItemDict;
}
interface ServerPlayerTryDestroyBlockEventArgs {
  cancel: boolean;
  playerId: PlayerId;
  x: hpl.int;
  y: hpl.int;
  z: hpl.int;
  dimensionId: DimensionId;
  blockName: string;
  auxData: hpl.int;
}
interface DamageEventArgs {
  cancel: boolean;
  victimId: EntityId;
  srcId?: EntityId;
  damage: hpl.float;
  cause: DamageCause;
}
interface ActuallyHurtServerEventArgs extends DamageEventArgs {}
interface ActorHurtServerEventArgs extends DamageEventArgs {}
interface PlayerAttackEntityEventArgs {
  cancel: boolean;
  playerId: PlayerId;
  victimId: EntityId;
  damage?: hpl.float;
}
interface AddEntityServerEventArgs { id: EntityId; engineTypeStr: string; }
interface EntityRemoveEventArgs { id: EntityId; }
interface ServerPlayerDieEventArgs { id: PlayerId; attacker?: EntityId; cause?: DamageCause; }
interface PlayerJoinMessageEventArgs { id: PlayerId; name: string; message: string; }
interface PlayerLeftMessageServerEventArgs { id: PlayerId; name: string; message: string; }
interface OnScriptTickServerEventArgs extends hpl.HplObject {}

interface EventNameArgs {
  ServerChatEvent: ServerChatEventArgs;
  ServerItemTryUseEvent: ServerItemTryUseEventArgs;
  ServerPlayerTryDestroyBlockEvent: ServerPlayerTryDestroyBlockEventArgs;
  ActuallyHurtServerEvent: ActuallyHurtServerEventArgs;
  ActorHurtServerEvent: ActorHurtServerEventArgs;
  PlayerAttackEntityEvent: PlayerAttackEntityEventArgs;
  AddEntityServerEvent: AddEntityServerEventArgs;
  EntityRemoveEvent: EntityRemoveEventArgs;
  ServerPlayerDieEvent: ServerPlayerDieEventArgs;
  PlayerJoinMessageEvent: PlayerJoinMessageEventArgs;
  PlayerLeftMessageServerEvent: PlayerLeftMessageServerEventArgs;
  OnScriptTickServer: OnScriptTickServerEventArgs;
}
type ServerEventName = keyof EventNameArgs;
