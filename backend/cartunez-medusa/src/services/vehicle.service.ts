import { Service } from "medusa-extender";
import { TransactionBaseService } from "@medusajs/medusa";
import { EntityManager } from "typeorm";
import { VehicleMake, VehicleModel, VehicleYear, VehicleVariant, ProductVehicleCompatibility } from "../models/vehicle";

@Service()
export class VehicleMakeService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected readonly container: Record<string, any>;

  async list(): Promise<VehicleMake[]> {
    return await this.atomicPhase_(async (manager) => {
      const repo = manager.getRepository(VehicleMake);
      return repo.find({ order: { name: "ASC" } });
    });
  }

  async listModels(makeId: string): Promise<VehicleModel[]> {
    return await this.atomicPhase_(async (manager) => {
      const repo = manager.getRepository(VehicleModel);
      return repo.find({ where: { make_id: makeId }, order: { name: "ASC" } });
    });
  }
}

@Service()
export class VehicleModelService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected readonly container: Record<string, any>;

  async listYears(modelId: string): Promise<VehicleYear[]> {
    return await this.atomicPhase_(async (manager) => {
      const repo = manager.getRepository(VehicleYear);
      return repo.find({ where: { model_id: modelId }, order: { year: "DESC" } });
    });
  }
}

@Service()
export class VehicleYearService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected readonly container: Record<string, any>;

  async listVariants(yearId: string): Promise<VehicleVariant[]> {
    return await this.atomicPhase_(async (manager) => {
      const repo = manager.getRepository(VehicleVariant);
      return repo.find({ where: { year_id: yearId }, order: { name: "ASC" } });
    });
  }
}

@Service()
export class VehicleService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected readonly container: Record<string, any>;

  async search(params: {
    make?: string;
    model?: string;
    year?: number;
    fuel_type?: string;
    transmission?: string;
  }): Promise<VehicleVariant[]> {
    return await this.atomicPhase_(async (manager) => {
      const qb = manager
        .getRepository(VehicleVariant)
        .createQueryBuilder("v")
        .innerJoinAndSelect("v.year", "y")
        .innerJoinAndSelect("y.model", "m")
        .innerJoinAndSelect("m.make", "mk");

      if (params.make) {
        qb.andWhere("mk.name ILIKE :make", { make: `%${params.make}%` });
      }
      if (params.model) {
        qb.andWhere("m.name ILIKE :model", { model: `%${params.model}%` });
      }
      if (params.year) {
        qb.andWhere("y.year = :year", { year: params.year });
      }
      if (params.fuel_type) {
        qb.andWhere("v.fuel_type = :fuel_type", { fuel_type: params.fuel_type });
      }
      if (params.transmission) {
        qb.andWhere("v.transmission = :transmission", { transmission: params.transmission });
      }

      return qb.getMany();
    });
  }
}

@Service()
export class VehicleCompatibilityService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected readonly container: Record<string, any>;

  async getProductCompatibility(productId: string): Promise<any> {
    return await this.atomicPhase_(async (manager) => {
      const repo = manager.getRepository(ProductVehicleCompatibility);
      return repo.find({
        where: { product_id: productId },
        relations: ["vehicle_variant", "vehicle_variant.year", "vehicle_variant.year.model", "vehicle_variant.year.model.make"],
      });
    });
  }

  async setProductCompatibility(
    productId: string,
    data: {
      variant_ids: string[];
      fitment_type?: string;
      notes?: string;
    }
  ): Promise<any> {
    return await this.atomicPhase_(async (manager) => {
      const repo = manager.getRepository(ProductVehicleCompatibility);

      // Remove existing compatibility entries
      await repo.delete({ product_id: productId });

      // Create new entries
      const entries = data.variant_ids.map((variantId) =>
        repo.create({
          product_id: productId,
          vehicle_variant_id: variantId,
          fitment_type: data.fitment_type || "exact",
          notes: data.notes,
        })
      );

      return repo.save(entries);
    });
  }

  async getProductsForVariant(variantId: string): Promise<any> {
    return await this.atomicPhase_(async (manager) => {
      const repo = manager.getRepository(ProductVehicleCompatibility);
      return repo.find({
        where: { vehicle_variant_id: variantId },
      });
    });
  }

  async getProductsForYear(yearId: string): Promise<any[]> {
    return await this.atomicPhase_(async (manager) => {
      const variantRepo = manager.getRepository(VehicleVariant);
      const variants = await variantRepo.find({ where: { year_id: yearId } });
      if (variants.length === 0) return [];

      const variantIds = variants.map((v) => v.id);
      const compatRepo = manager.getRepository(ProductVehicleCompatibility);

      // TypeORM In() helper for multiple IDs
      const results = await compatRepo
        .createQueryBuilder("pvc")
        .where("pvc.vehicle_variant_id IN (:...variantIds)", { variantIds })
        .select(["pvc.product_id", "pvc.vehicle_variant_id", "pvc.fitment_type"])
        .getMany();

      return results;
    });
  }
}

export default VehicleService;
