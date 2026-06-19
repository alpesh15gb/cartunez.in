import uuid
from pydantic import BaseModel, ConfigDict

class GalleryItemBase(BaseModel):
    title: str
    image: str
    category: str
    vehicle: str

class GalleryItemCreate(GalleryItemBase):
    pass

class GalleryItemResponse(GalleryItemBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
