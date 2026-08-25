import strawberry


@strawberry.type
class Mutation:

  @strawberry.mutation
  def placeholder(self) -> str:
    return "placeholder"
