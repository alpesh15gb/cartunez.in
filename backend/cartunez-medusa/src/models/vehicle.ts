import { Entity as Entity_, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, Index, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity_("vehicle_make")
export class VehicleMake {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  country: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @OneToMany(() => VehicleModel, (model) => model.make)
  models: VehicleModel[];
}

@Entity_("vehicle_model")
export class VehicleModel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 150 })
  name: string;

  @Column({ type: "uuid" })
  @Index()
  make_id: string;

  @ManyToOne(() => VehicleMake, (make) => make.models, { onDelete: "CASCADE" })
  @JoinColumn({ name: "make_id" })
  make: VehicleMake;

  @Column({ type: "varchar", length: 50, nullable: true })
  body_type: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @OneToMany(() => VehicleYear, (year) => year.model)
  years: VehicleYear[];
}

@Entity_("vehicle_year")
export class VehicleYear {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int" })
  year: number;

  @Column({ type: "uuid" })
  @Index()
  model_id: string;

  @ManyToOne(() => VehicleModel, (model) => model.years, { onDelete: "CASCADE" })
  @JoinColumn({ name: "model_id" })
  model: VehicleModel;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @OneToMany(() => VehicleVariant, (variant) => variant.year)
  variants: VehicleVariant[];
}

@Entity_("vehicle_variant")
export class VehicleVariant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "uuid" })
  @Index()
  year_id: string;

  @ManyToOne(() => VehicleYear, (year) => year.variants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "year_id" })
  year: VehicleYear;

  @Column({ type: "varchar", length: 50, nullable: true })
  engine_type: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  fuel_type: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  transmission: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}

@Entity_("product_vehicle_compatibility")
export class ProductVehicleCompatibility {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  @Index()
  product_id: string;

  @Column({ type: "uuid" })
  @Index()
  vehicle_variant_id: string;

  @ManyToOne(() => VehicleVariant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_variant_id" })
  vehicle_variant: VehicleVariant;

  @Column({ type: "varchar", length: 20, nullable: true })
  fitment_type: string; // "exact", "universal", "cross-reference"

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
